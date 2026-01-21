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
    'npm': 'npm',
    'powershell': 'terminal-powershell',
    'shell': 'terminal-bash',
    'bash': 'terminal-bash',
    'cargo': 'package',
    'dotnet': 'symbol-module',
    'gulp': 'package',
    'gradle': 'package',
    'jake': 'package',
    'make': 'wrench',
    'maven': 'package',
    'python': 'python',
    'ruby': 'gem',
    'go': 'symbol-package',
    'docker': 'docker',
    'typescript': 'bracket-square',
    'batch': 'terminal',
    'java': 'symbol-class',
    'perl': 'code',
    'php': 'symbol-method',
    'csharp': 'symbol-interface',
    'rust': 'package',
    'swift': 'symbol-structure',
    'other': 'checklist'
  };

  constructor(public readonly task: vscode.Task, isRunning: boolean = false) {
    super(task.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = isRunning ? 'tasker.task.running' : 'tasker.task';
    
    // Get task type and find appropriate icon
    const taskType = task.definition?.type || 'other';
    const iconName = TaskTreeItem.TASK_TYPE_ICONS[taskType] || 'checklist';
    this.iconPath = new vscode.ThemeIcon(iconName);
    
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
    vscode.commands.registerCommand('tasker.editTask', async (_item: TaskTreeItem) => {
      // Open tasks.json for editing
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
      }

      const tasksJsonPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.vscode', 'tasks.json');
      await vscode.commands.executeCommand('vscode.open', tasksJsonPath);
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
