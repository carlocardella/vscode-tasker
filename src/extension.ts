import * as vscode from 'vscode';

class TaskTreeItem extends vscode.TreeItem {
  constructor(public readonly task: vscode.Task) {
    super(task.name, vscode.TreeItemCollapsibleState.None);
    this.description = task.definition?.type;
    this.contextValue = 'taskExplorer.task';
    this.iconPath = new vscode.ThemeIcon('checklist');
    this.command = {
      command: 'taskExplorer.openTask',
      title: 'Open Task',
      arguments: [this]
    };
  }
}

class TaskExplorerProvider implements vscode.TreeDataProvider<TaskTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TaskTreeItem | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TaskTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    if (element) {
      return [];
    }

    const tasks = await vscode.tasks.fetchTasks();
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks
      .map((task: vscode.Task) => new TaskTreeItem(task))
      .sort((a, b) => {
        const aLabel = typeof a.label === 'string' ? a.label : a.label?.label ?? '';
        const bLabel = typeof b.label === 'string' ? b.label : b.label?.label ?? '';
        return aLabel.localeCompare(bLabel);
      });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new TaskExplorerProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('taskExplorerView', provider),
    vscode.commands.registerCommand('taskExplorer.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('taskExplorer.openTask', async (item?: TaskTreeItem) => {
      const target = item;
      if (!target) {
        vscode.window.showInformationMessage('Select a task to run.');
        return;
      }

      try {
        await vscode.tasks.executeTask(target.task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Failed to start task: ${message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri) => {
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
