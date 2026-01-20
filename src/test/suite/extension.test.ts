import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension activates', async () => {
    const extension = vscode.extensions.getExtension('carlocardella.vscode-taskexplorer');
    await extension?.activate();

    assert.ok(extension?.isActive, 'Extension should be active after activation');
  });
});
