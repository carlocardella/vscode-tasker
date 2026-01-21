import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { TaskGroupItem, TaskTreeItem, TaskExplorerProvider } from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension activates', async () => {
    const extension = vscode.extensions.getExtension('carlocardella.vscode-taskexplorer');
    await extension?.activate();

    assert.ok(extension?.isActive, 'Extension should be active after activation');
  });

  suite('TaskGroupItem', () => {
    test('Creates group with correct label and description', () => {
      const tasks: vscode.Task[] = [
        new vscode.Task(
          { type: 'npm' },
          vscode.TaskScope.Workspace,
          'test',
          'npm',
          new vscode.ShellExecution('npm test')
        )
      ];

      const group = new TaskGroupItem('npm', tasks);
      assert.strictEqual(group.label, 'npm', 'Should have correct label');
      assert.strictEqual(group.description, '1 task', 'Should display singular task count');
    });

    test('Displays correct plural count', () => {
      const tasks: vscode.Task[] = [
        new vscode.Task(
          { type: 'npm' },
          vscode.TaskScope.Workspace,
          'test',
          'npm',
          new vscode.ShellExecution('npm test')
        ),
        new vscode.Task(
          { type: 'npm' },
          vscode.TaskScope.Workspace,
          'build',
          'npm',
          new vscode.ShellExecution('npm build')
        )
      ];

      const group = new TaskGroupItem('npm', tasks);
      assert.strictEqual(group.description, '2 tasks', 'Should display plural task count');
    });

    test('Has correct icon and context value', () => {
      const group = new TaskGroupItem('npm', []);
      assert.strictEqual(group.contextValue, 'taskExplorer.group', 'Should have group context value');
      assert.ok(group.iconPath, 'Should have icon path');
    });

    test('Is collapsible', () => {
      const group = new TaskGroupItem('npm', []);
      assert.strictEqual(group.collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Should be expanded');
    });
  });

  suite('TaskTreeItem', () => {
    test('Creates item with correct context value when not running', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task, false);
      assert.strictEqual(item.contextValue, 'taskExplorer.task', 'Should have task context value');
    });

    test('Creates item with correct context value when running', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task, true);
      assert.strictEqual(item.contextValue, 'taskExplorer.task.running', 'Should have running context value');
    });

    test('Has correct icon and tooltip', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task);
      assert.ok(item.iconPath, 'Should have icon path');
      assert.strictEqual(item.tooltip, 'test', 'Should set tooltip to task name');
    });

    test('Is not collapsible', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task);
      assert.strictEqual(item.collapsibleState, vscode.TreeItemCollapsibleState.None, 'Should not be collapsible');
    });
  });

  suite('TaskExplorerProvider', () => {
    test('Initializes with no running tasks', () => {
      const provider = new TaskExplorerProvider();
      
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      assert.strictEqual(provider.isTaskRunning(task), false, 'Task should not be running initially');
    });

    test('Tracks task running state', () => {
      const provider = new TaskExplorerProvider();
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      assert.strictEqual(provider.isTaskRunning(task), false, 'Task should not be running initially');
      
      provider.markTaskRunning(task);
      assert.strictEqual(provider.isTaskRunning(task), true, 'Task should be marked as running');
      
      provider.markTaskStopped(task);
      assert.strictEqual(provider.isTaskRunning(task), false, 'Task should be marked as stopped');
    });

    test('Tracks multiple tasks independently', () => {
      const provider = new TaskExplorerProvider();
      
      const task1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const task2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'build',
        'npm',
        new vscode.ShellExecution('npm build')
      );

      provider.markTaskRunning(task1);
      
      assert.strictEqual(provider.isTaskRunning(task1), true, 'Task 1 should be running');
      assert.strictEqual(provider.isTaskRunning(task2), false, 'Task 2 should not be running');
      
      provider.markTaskRunning(task2);
      assert.strictEqual(provider.isTaskRunning(task1), true, 'Task 1 should still be running');
      assert.strictEqual(provider.isTaskRunning(task2), true, 'Task 2 should now be running');
      
      provider.markTaskStopped(task1);
      assert.strictEqual(provider.isTaskRunning(task1), false, 'Task 1 should be stopped');
      assert.strictEqual(provider.isTaskRunning(task2), true, 'Task 2 should still be running');
    });

    test('Provides onDidChangeTreeData event', () => {
      const provider = new TaskExplorerProvider();
      
      let eventFired = false;
      provider.onDidChangeTreeData((_) => {
        eventFired = true;
      });
      
      provider.refresh();
      assert.ok(eventFired, 'onDidChangeTreeData event should fire on refresh');
    });

    test('Returns tree item from getTreeItem', () => {
      const provider = new TaskExplorerProvider();
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task);
      const result = provider.getTreeItem(item);
      
      assert.strictEqual(result, item, 'Should return same tree item');
    });

    test('Returns empty children for root when no tasks', async () => {
      const provider = new TaskExplorerProvider();
      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([]);
      
      try {
        const children = await provider.getChildren();
        assert.strictEqual(children?.length, 0, 'Should return empty array for no tasks');
      } finally {
        stub.restore();
      }
    });
  });
});
