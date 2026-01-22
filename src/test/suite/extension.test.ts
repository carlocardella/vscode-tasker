import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { TaskGroupItem, TaskTreeItem, TaskerProvider } from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension activates', async () => {
    const extension = vscode.extensions.getExtension('carlocardella.vscode-tasker');
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
      assert.strictEqual(group.contextValue, 'tasker.group', 'Should have group context value');
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
      assert.strictEqual(item.contextValue, 'tasker.task', 'Should have task context value');
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
      assert.strictEqual(item.contextValue, 'tasker.task.running', 'Should have running context value');
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

    test('Sets correct icon for npm tasks', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'package', 'npm tasks should have package icon');
    });

    test('Sets correct icon for typescript tasks', () => {
      const task = new vscode.Task(
        { type: 'typescript' },
        vscode.TaskScope.Workspace,
        'build',
        'typescript',
        new vscode.ShellExecution('tsc')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'package', 'typescript tasks should have icon');
    });

    test('Sets correct icon for shell tasks', () => {
      const task = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'build',
        'shell',
        new vscode.ShellExecution('bash ./build.sh')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'terminal-bash', 'shell tasks should have terminal-bash icon');
    });

    test('Sets correct icon for powershell tasks', () => {
      const task = new vscode.Task(
        { type: 'powershell' },
        vscode.TaskScope.Workspace,
        'build',
        'powershell',
        new vscode.ShellExecution('powershell ./build.ps1')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'terminal-powershell', 'powershell tasks should have terminal-powershell icon');
    });

    test('Uses fallback icon for unknown task types', () => {
      const task = new vscode.Task(
        { type: 'unknown-type' },
        vscode.TaskScope.Workspace,
        'test',
        'unknown',
        new vscode.ShellExecution('echo test')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'package', 'Unknown tasks should fall back to package icon');
    });

    test('Uses fallback icon when task has no type', () => {
      const taskDef: vscode.TaskDefinition = { type: '' };
      const task = new vscode.Task(
        taskDef,
        vscode.TaskScope.Workspace,
        'test',
        'custom',
        new vscode.ShellExecution('echo test')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'package', 'Tasks with empty type should fall back to package icon');
    });

    test('Sets task name as label', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'compile',
        'npm',
        new vscode.ShellExecution('npm run compile')
      );

      const item = new TaskTreeItem(task);
      assert.strictEqual(item.label, 'compile', 'Item label should match task name');
    });
  });

  suite('TaskerProvider', () => {
    test('Initializes with no running tasks', () => {
      const provider = new TaskerProvider();
      
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
      const provider = new TaskerProvider();
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
      const provider = new TaskerProvider();
      
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
      const provider = new TaskerProvider();
      
      let eventFired = false;
      provider.onDidChangeTreeData((_: any) => {
        eventFired = true;
      });
      
      provider.refresh();
      assert.ok(eventFired, 'onDidChangeTreeData event should fire on refresh');
    });

    test('Returns tree item from getTreeItem', () => {
      const provider = new TaskerProvider();
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
      const provider = new TaskerProvider();
      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([]);
      
      try {
        const children = await provider.getChildren();
        assert.strictEqual(children?.length, 0, 'Should return empty array for no tasks');
      } finally {
        stub.restore();
      }
    });

    test('Groups tasks by type at root level', async () => {
      const provider = new TaskerProvider();
      const npmTask1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const npmTask2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'build',
        'npm',
        new vscode.ShellExecution('npm build')
      );

      const tsTask = new vscode.Task(
        { type: 'typescript' },
        vscode.TaskScope.Workspace,
        'compile',
        'typescript',
        new vscode.ShellExecution('tsc')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([npmTask1, npmTask2, tsTask]);
      
      try {
        const groups = await provider.getChildren();
        assert.ok(groups && groups.length === 2, 'Should have 2 groups (npm and typescript)');
        assert.ok(groups.some(g => (g as TaskGroupItem).taskType === 'npm'), 'Should have npm group');
        assert.ok(groups.some(g => (g as TaskGroupItem).taskType === 'typescript'), 'Should have typescript group');
      } finally {
        stub.restore();
      }
    });

    test('Returns tasks for a group', async () => {
      const provider = new TaskerProvider();
      const npmTask1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const npmTask2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'build',
        'npm',
        new vscode.ShellExecution('npm build')
      );

      const group = new TaskGroupItem('npm', [npmTask1, npmTask2]);
      
      const tasks = await provider.getChildren(group);
      assert.ok(tasks && tasks.length === 2, 'Should return 2 tasks for npm group');
      assert.ok(tasks.every(t => t instanceof TaskTreeItem), 'All items should be TaskTreeItems');
    });

    test('Returns tasks sorted by name within a group', async () => {
      const provider = new TaskerProvider();
      const task1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'zebra',
        'npm',
        new vscode.ShellExecution('npm run zebra')
      );

      const task2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'alpha',
        'npm',
        new vscode.ShellExecution('npm run alpha')
      );

      const group = new TaskGroupItem('npm', [task1, task2]);
      
      const tasks = await provider.getChildren(group);
      assert.ok(tasks && tasks.length === 2, 'Should return 2 tasks');
      assert.strictEqual((tasks[0] as TaskTreeItem).task.name, 'alpha', 'First task should be alpha');
      assert.strictEqual((tasks[1] as TaskTreeItem).task.name, 'zebra', 'Second task should be zebra');
    });

    test('Updates context value based on running state', () => {
      const provider = new TaskerProvider();
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const item = new TaskTreeItem(task, false);
      assert.strictEqual(item.contextValue, 'tasker.task', 'Initially should be tasker.task');

      provider.markTaskRunning(task);
      const updatedItem = provider.getTreeItem(item);
      assert.strictEqual(updatedItem.contextValue, 'tasker.task.running', 'Should update to tasker.task.running');
    });
  });
});
