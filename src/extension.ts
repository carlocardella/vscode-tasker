import * as vscode from 'vscode';

type TreeNode = TaskGroupItem | TaskTreeItem;

class TaskGroupItem extends vscode.TreeItem {
  constructor(
    public readonly taskType: string,
    public readonly tasks: vscode.Task[]
  ) {
    super(taskType, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'tasker.group';
    this.description = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

class TaskTreeItem extends vscode.TreeItem {
  private static readonly TASK_TYPE_ICONS: Record<string, string> = {
    'npm': 'package',
    'powershell': 'terminal-powershell',
    'shell': 'terminal-bash',
    'bash': 'terminal-bash',
    'cargo': 'package',
    'dotnet': 'package',
    'gulp': 'package',
    'gradle': 'package',
    'jake': 'package',
    'grunt': 'package',
    'make': 'wrench',
    'maven': 'package',
    'python': 'package',
    'ruby': 'ruby',
    'go': 'package',
    'docker': 'server',
    'typescript': 'package',
    'batch': 'terminal',
    'java': 'package',
    'process': 'gear'
  };

  constructor(public readonly task: vscode.Task, isRunning: boolean = false) {
    super(task.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = isRunning ? 'tasker.task.running' : 'tasker.task';
    
    // Get task type and find appropriate icon
    const taskType = task.definition?.type || 'other';
    const iconName = TaskTreeItem.TASK_TYPE_ICONS[taskType] || 'package';
    try {
      this.iconPath = new vscode.ThemeIcon(iconName);
    } catch (error) {
      // If icon name is invalid, fall back to package icon
      this.iconPath = new vscode.ThemeIcon('package');
    }
    
    this.tooltip = task.name;
  }
}

class TaskerProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private runningTasks = new Set<string>();

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  isTaskRunning(task: vscode.Task): boolean {
    return this.runningTasks.has(this.getTaskId(task));
  }

  markTaskRunning(task: vscode.Task): void {
    this.runningTasks.add(this.getTaskId(task));
    this._onDidChangeTreeData.fire();
  }

  markTaskStopped(task: vscode.Task): void {
    this.runningTasks.delete(this.getTaskId(task));
    this._onDidChangeTreeData.fire();
  }

  private getTaskId(task: vscode.Task): string {
    return `${task.definition?.type || 'other'}:${task.name}`;
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    if (element instanceof TaskTreeItem) {
      element.contextValue = this.isTaskRunning(element.task) ? 'tasker.task.running' : 'tasker.task';
    }
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      // Root level: return task groups
      const allTasks = await vscode.tasks.fetchTasks();
      if (!allTasks || allTasks.length === 0) {
        return [];
      }

      // Group tasks by type
      const tasksByType = new Map<string, vscode.Task[]>();
      for (const task of allTasks) {
        const taskType = task.definition?.type || 'other';
        if (!tasksByType.has(taskType)) {
          tasksByType.set(taskType, []);
        }
        tasksByType.get(taskType)!.push(task);
      }

      // Sort groups alphabetically
      const sortedTypes = Array.from(tasksByType.keys()).sort((a, b) => a.localeCompare(b));
      
      return sortedTypes.map(taskType => new TaskGroupItem(taskType, tasksByType.get(taskType)!));
    } else if (element instanceof TaskGroupItem) {
      // Return tasks for the group
      return element.tasks
        .map((task: vscode.Task) => new TaskTreeItem(task, this.isTaskRunning(task)))
        .sort((a, b) => {
          return a.task.name.localeCompare(b.task.name);
        });
    }

    return [];
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new TaskerProvider();
  let executionMap = new Map<vscode.TaskExecution, vscode.Task>();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('taskerView', provider),
    vscode.commands.registerCommand('tasker.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('tasker.runTask', async (item: TaskTreeItem) => {
      try {
        const execution = await vscode.tasks.executeTask(item.task);
        provider.markTaskRunning(item.task);
        executionMap.set(execution, item.task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Failed to start task: ${message}`);
      }
    }),
    vscode.commands.registerCommand('tasker.stopTask', async (item: TaskTreeItem) => {
      try {
        for (const [execution, task] of executionMap.entries()) {
          if (task === item.task) {
            execution.terminate();
            provider.markTaskStopped(item.task);
            executionMap.delete(execution);
            break;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Failed to stop task: ${message}`);
      }
    }),
    vscode.commands.registerCommand('tasker.editTask', async (item: TaskTreeItem) => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
      }

      const task = item.task;
      const taskType = task.definition?.type;
      const workspaceRoot = workspaceFolders[0].uri;

      // Helper function to search for text and position cursor
      const openFileAtPosition = async (filePath: vscode.Uri, searchPattern: RegExp): Promise<boolean> => {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const text = document.getText();
          const match = searchPattern.exec(text);
          
          if (match) {
            const position = document.positionAt(match.index);
            const editor = await vscode.window.showTextDocument(document);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            return true;
          }
          
          // If not found but file exists, just open it
          await vscode.window.showTextDocument(document);
          return true;
        } catch (error) {
          return false;
        }
      };

      // Check if task has custom config (indicates tasks.json definition)
      const hasCustomConfig = task.problemMatchers && task.problemMatchers.length > 0;
      
      // Try tasks.json first for tasks with custom config
      if (hasCustomConfig) {
        const tasksJsonPath = vscode.Uri.joinPath(workspaceRoot, '.vscode', 'tasks.json');
        let pattern: RegExp;
        if (taskType === 'npm' && task.definition.script) {
          pattern = new RegExp(`"script"\\s*:\\s*"${task.definition.script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
        } else {
          pattern = new RegExp(`"label"\\s*:\\s*"${task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
        }
        
        if (await openFileAtPosition(tasksJsonPath, pattern)) {
          return;
        }
      }

      // Handle different task types based on their source
      switch (taskType) {
        case 'npm': {
          // Open package.json for npm scripts
          const packageJsonPath = vscode.Uri.joinPath(workspaceRoot, 'package.json');
          const scriptName = task.definition.script;
          if (scriptName) {
            const pattern = new RegExp(`"${scriptName}"\\s*:\\s*"`, 'g');
            await openFileAtPosition(packageJsonPath, pattern);
          }
          break;
        }

        case 'gulp': {
          // Try gulpfile.js, gulpfile.ts, gulpfile.babel.js
          const gulpFiles = ['gulpfile.js', 'gulpfile.ts', 'gulpfile.babel.js'];
          for (const filename of gulpFiles) {
            const gulpPath = vscode.Uri.joinPath(workspaceRoot, filename);
            const taskName = task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`gulp\\.task\\s*\\(\\s*['"\`]${taskName}['"\`]`, 'g');
            if (await openFileAtPosition(gulpPath, pattern)) {
              return;
            }
          }
          break;
        }

        case 'grunt': {
          // Try Gruntfile.js, Gruntfile.coffee
          const gruntFiles = ['Gruntfile.js', 'Gruntfile.coffee'];
          for (const filename of gruntFiles) {
            const gruntPath = vscode.Uri.joinPath(workspaceRoot, filename);
            const taskName = task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`['"\`]${taskName}['"\`]`, 'g');
            if (await openFileAtPosition(gruntPath, pattern)) {
              return;
            }
          }
          break;
        }

        case 'typescript': {
          // Open tsconfig.json
          const tsconfigPath = vscode.Uri.joinPath(workspaceRoot, 'tsconfig.json');
          await openFileAtPosition(tsconfigPath, /.*/);
          break;
        }

        case 'shell':
        case 'process': {
          // For shell/process tasks, try to find referenced script files
          const command = task.definition.command;
          if (command && typeof command === 'string') {
            // Extract potential file paths from the command
            const fileMatch = command.match(/\.\/[\w/\-\.]+\.(?:sh|ps1|cmd|bat|py|rb|js|ts)/);
            if (fileMatch) {
              const scriptPath = vscode.Uri.joinPath(workspaceRoot, fileMatch[0]);
              if (await openFileAtPosition(scriptPath, /.*/)) {
                return;
              }
            }
          }
          
          // Fall back to tasks.json
          const tasksJsonPath = vscode.Uri.joinPath(workspaceRoot, '.vscode', 'tasks.json');
          const pattern = new RegExp(`"label"\\s*:\\s*"${task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          await openFileAtPosition(tasksJsonPath, pattern);
          break;
        }

        default: {
          // Default: try tasks.json
          const tasksJsonPath = vscode.Uri.joinPath(workspaceRoot, '.vscode', 'tasks.json');
          const pattern = new RegExp(`"label"\\s*:\\s*"${task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          await openFileAtPosition(tasksJsonPath, pattern);
        }
      }
    })
  );

  // Monitor task execution end
  vscode.tasks.onDidEndTaskProcess((event) => {
    for (const [execution, task] of executionMap.entries()) {
      if (execution.task === event.execution.task) {
        provider.markTaskStopped(task);
        executionMap.delete(execution);
        break;
      }
    }
  });

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri: vscode.Uri) => {
        if (uri.path.endsWith('refresh')) {
          provider.refresh();
        }
      }
    })
  );
}

export function deactivate(): void {
  // nothing to clean up yet
}

// Export classes for testing
export { TaskGroupItem, TaskTreeItem, TaskerProvider };
