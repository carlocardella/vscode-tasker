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
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub().withArgs('defaultFolderState', 'expanded').returns('expanded')
      };
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        const group = new TaskGroupItem('npm', []);
        assert.strictEqual(group.collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Should be expanded');
      } finally {
        getConfigStub.restore();
      }
    });

    test('Respects defaultFolderState configuration - expanded', () => {
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub().withArgs('defaultFolderState', 'expanded').returns('expanded')
      };
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        const group = new TaskGroupItem('npm', []);
        assert.strictEqual(group.collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Should be expanded when config is expanded');
      } finally {
        getConfigStub.restore();
      }
    });

    test('Respects defaultFolderState configuration - collapsed', () => {
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub().withArgs('defaultFolderState', 'expanded').returns('collapsed')
      };
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        const group = new TaskGroupItem('npm', []);
        assert.strictEqual(group.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'Should be collapsed when config is collapsed');
      } finally {
        getConfigStub.restore();
      }
    });

    test('Respects explicit collapsible state over configuration', () => {
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub().withArgs('defaultFolderState', 'expanded').returns('collapsed')
      };
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        const group = new TaskGroupItem('npm', [], vscode.TreeItemCollapsibleState.Expanded);
        assert.strictEqual(group.collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Should use explicit state over configuration');
      } finally {
        getConfigStub.restore();
      }
    });

    test('Uses custom icon from configuration', () => {
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub()
      };
      configStub.get.withArgs('defaultFolderState', 'expanded').returns('expanded');
      configStub.get.withArgs('icons', {}).returns({ 'npm': 'archive' });
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        const group = new TaskGroupItem('npm', []);
        const iconPath = group.iconPath as vscode.ThemeIcon;
        assert.strictEqual(iconPath.id, 'archive', 'Should use custom icon from configuration');
      } finally {
        getConfigStub.restore();
      }
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

    test('Sets correct icon for process tasks (tasks.json)', () => {
      const task = new vscode.Task(
        { type: 'process' },
        vscode.TaskScope.Workspace,
        'backend',
        'process',
        new vscode.ProcessExecution('node app.js')
      );

      const item = new TaskTreeItem(task);
      const iconPath = item.iconPath as vscode.ThemeIcon;
      assert.ok(iconPath && iconPath.id === 'gear', 'process tasks should have gear icon');
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

    test('Uses custom icon from configuration', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub()
      };
      configStub.get.withArgs('icons', {}).returns({ 'npm': 'beaker' });
      getConfigStub.withArgs('tasker').returns(configStub as any);

      try {
        const item = new TaskTreeItem(task);
        const iconPath = item.iconPath as vscode.ThemeIcon;
        assert.strictEqual(iconPath.id, 'beaker', 'Should use custom icon');
      } finally {
        getConfigStub.restore();
      }
    });

    test('Tooltip includes last execution time when provided', () => {
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const now = new Date();
      const item = new TaskTreeItem(task, false, undefined, now);
      
      assert.ok((item.tooltip as string).includes('Last executed'), 'Tooltip should contain "Last executed"');
      assert.ok((item.tooltip as string).includes(now.toLocaleString()), 'Tooltip should contain the formatted date');
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
        assert.ok(groups.some(g => (g as TaskGroupItem).label === 'npm'), 'Should have npm group');
        assert.ok(groups.some(g => (g as TaskGroupItem).label === 'typescript'), 'Should have typescript group');
      } finally {
        stub.restore();
      }
    });

    test('Handles tasks defined in tasks.json (process type)', async () => {
      const provider = new TaskerProvider();
      const task = new vscode.Task(
        { type: 'process' },
        vscode.TaskScope.Workspace,
        'custom-task',
        'process',
        new vscode.ProcessExecution('echo hello')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([task]);
      
      try {
        const groups = await provider.getChildren();
        assert.ok(groups.some(g => (g as TaskGroupItem).label === 'process'), 'Should contain process group');
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

    test('Groups tasks by name prefix (underscore)', async () => {
      const provider = new TaskerProvider();
      const task1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'TEST_bin1',
        'npm',
        new vscode.ShellExecution('echo 1')
      );

      const task2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'TEST_bin2',
        'npm',
        new vscode.ShellExecution('echo 2')
      );

      const group = new TaskGroupItem('npm', [task1, task2]);
      
      // First level should return a group named "TEST"
      const children = await provider.getChildren(group);
      assert.strictEqual(children.length, 1, 'Should group into one item');
      const testGroup = children[0] as TaskGroupItem;
      assert.ok(testGroup instanceof TaskGroupItem, 'Child should be a group');
      assert.strictEqual(testGroup.label, 'TEST', 'Group label should be prefix');
      assert.strictEqual(testGroup.isNameGroup, true, 'Should be marked as name group');
      assert.strictEqual(testGroup.tasks.length, 2, 'Group should contain 2 tasks');
    });

    test('Groups tasks by name prefix with custom separator', async () => {
      const provider = new TaskerProvider();
      const task1 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'TEST-bin1',
        'npm',
        new vscode.ShellExecution('echo 1')
      );

      const task2 = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'TEST-bin2',
        'npm',
        new vscode.ShellExecution('echo 2')
      );

      const group = new TaskGroupItem('npm', [task1, task2]);
      
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub()
      };
      configStub.get.withArgs('groupTasksByName', true).returns(true);
      configStub.get.withArgs('groupSeparator', '_').returns('-');
      configStub.get.withArgs('defaultFolderState', 'expanded').returns('expanded');
      configStub.get.withArgs('icons', {}).returns({});
      getConfigStub.withArgs('tasker').returns(configStub as any);

      try {
        // First level should return a group named "TEST"
        const children = await provider.getChildren(group);
        assert.strictEqual(children.length, 1, 'Should group into one item');
        const testGroup = children[0] as TaskGroupItem;
        assert.ok(testGroup instanceof TaskGroupItem, 'Child should be a group');
        assert.strictEqual(testGroup.label, 'TEST', 'Group label should be prefix');
        assert.strictEqual(testGroup.isNameGroup, true, 'Should be marked as name group');
        assert.strictEqual(testGroup.tasks.length, 2, 'Group should contain 2 tasks');

        // Verify children of the group have prefix removed correctly using the separator
        const groupTasks = await provider.getChildren(testGroup);
        assert.strictEqual(groupTasks.length, 2);
        const labels = groupTasks.map(t => t.label).sort();
        assert.deepStrictEqual(labels, ['bin1', 'bin2']);
      } finally {
        getConfigStub.restore();
      }
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

    test('expandAll sets all groups to expanded', async () => {
      const provider = new TaskerProvider();
      const npmTask = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const shellTask = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'build',
        'shell',
        new vscode.ShellExecution('build.sh')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([npmTask, shellTask]);
      
      try {
        provider.expandAll();
        const groups = await provider.getChildren();
        assert.ok(groups && groups.length === 2, 'Should have 2 groups');
        assert.ok(groups.every(g => g.collapsibleState === vscode.TreeItemCollapsibleState.Expanded), 'All groups should be expanded');
      } finally {
        stub.restore();
      }
    });

    test('collapseAll sets all groups to collapsed', async () => {
      const provider = new TaskerProvider();
      const npmTask = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const shellTask = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'build',
        'shell',
        new vscode.ShellExecution('build.sh')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([npmTask, shellTask]);
      
      try {
        provider.collapseAll();
        const groups = await provider.getChildren();
        assert.ok(groups && groups.length === 2, 'Should have 2 groups');
        assert.ok(groups.every(g => g.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed), 'All groups should be collapsed');
      } finally {
        stub.restore();
      }
    });

    test('refresh clears explicit collapsible state', async () => {
      const provider = new TaskerProvider();
      const npmTask = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([npmTask]);
      const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
      const configStub = {
        get: sinon.stub().withArgs('defaultFolderState', 'expanded').returns('collapsed')
      };
      getConfigStub.withArgs('tasker').returns(configStub as any);
      
      try {
        // First expand all
        provider.expandAll();
        let groups = await provider.getChildren();
        assert.strictEqual(groups[0].collapsibleState, vscode.TreeItemCollapsibleState.Expanded, 'Should be expanded after expandAll');
        
        // Then refresh - should revert to config
        provider.refresh();
        groups = await provider.getChildren();
        assert.strictEqual(groups[0].collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'Should be collapsed after refresh (per config)');
      } finally {
        stub.restore();
        getConfigStub.restore();
      }
    });

    test('Updates last execution time when task starts', async () => {
      const provider = new TaskerProvider();
      const task = new vscode.Task(
        { type: 'npm' },
        vscode.TaskScope.Workspace,
        'test',
        'npm',
        new vscode.ShellExecution('npm test')
      );

      const stub = sinon.stub(vscode.tasks, 'fetchTasks').resolves([task]);
      
      try {
        // Run task to set execution time
        provider.markTaskRunning(task);
        
        // Verify the time is propagated to the tree item
        const groups = await provider.getChildren();
        const children = await provider.getChildren(groups[0]);
        const item = children[0] as TaskTreeItem;
        
        assert.ok((item.tooltip as string).includes('Last executed'), 'Tooltip should include execution time after running');
      } finally {
        stub.restore();
      }
    });
  });
});
