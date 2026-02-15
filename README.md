# Task Explorer (Preview)

<!-- ![.github/workflows/BuildAndPublish.yml](https://github.com/carlocardella/vscode-tasker/workflows/.github/workflows/BuildAndPublish.yml/badge.svg?branch=master) -->
![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/carlocardella.vscode-tasker)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/carlocardella.vscode-tasker)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/carlocardella.vscode-tasker)
![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/carlocardella.vscode-tasker)
[![GitHub issues](https://img.shields.io/github/issues/carlocardella/vscode-tasker.svg)](https://github.com/carlocardella/vscode-tasker/issues)
[![GitHub license](https://img.shields.io/github/license/carlocardella/vscode-tasker.svg)](https://github.com/carlocardella/vscode-tasker/blob/master/LICENSE)
<!-- [![Twitter](https://img.shields.io/twitter/url/https/github.com/carlocardella/vscode-tasker.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fcarlocardella%2Fvscode-tasker) -->
<!-- [![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/carlocardella/vscode-tasker) -->

[Download for VS Code](https://marketplace.visualstudio.com/items?itemName=carlocardella.vscode-tasker)

<!-- [Download for VS Codium](https://open-vsx.org/extension/carlocardella/vscode-tasker) -->

<div align="left">
  <img src="media/task-checklist-arrow.png" alt="VSCode Auto Git Extension Icon" width="96" height="96" style="float:left; margin-right: 1em; margin-bottom: 1em;" />
</div>


Task Explorer is a VS Code extension that surfaces your defined tasks in a dedicated sidebar view so you can browse and run them quickly.

<br>
<br>

## Features
- Sidebar view showing available VS Code tasks grouped by type (npm, shell, PowerShell, etc.)
- Inline hover actions on each task: run/stop (state-aware) and edit (opens tasks.json)
- Command palette actions to refresh the list and run/stop/edit a task
- Last Execution Time: Hover over any task to see exactly when it was last run in the tooltip
- Bundled with webpack for fast activation and small packages

## Getting Started
1) Install dependencies

```
npm install
```

2) Build the extension (bundled output in `dist`)

```
npm run compile
```

3) Launch the Extension Host (F5) using the provided launch config.

## Configuration

### Custom Icons
You can customize icons for specific task types or groups using the `tasker.icons` setting. Map the task type (e.g., `npm`, `shell`) or group name to a valid Codicon ID. You can find the list of available icons [here](https://code.visualstudio.com/api/references/icons-in-labels).

Example configuration in `settings.json`:
```json
"tasker.icons": {
  "npm": "beaker",
  "shell": "terminal-bash",
  "build": "tools"
}
```

### Other Settings
- `tasker.groupTasksByName`: Group tasks by name prefix (default: `true`).
- `tasker.groupSeparator`: Separator for task grouping (default: `_`).
- `tasker.defaultFolderState`: Default state for task groups (`expanded` or `collapsed`).
- `tasker.exclude`: List of task types to exclude.

## Commands & Views
- View: Task Explorer (Activity Bar)
- Commands:
	- Task Explorer: Refresh
	- Task Explorer: Run Task (shows as a run button when stopped)
	- Task Explorer: Stop Task (shows as a stop button when running)
	- Task Explorer: Edit Task (opens .vscode/tasks.json)

## Testing
```
npm test
```
Runs a minimal test suite via @vscode/test-electron.

## Packaging
```
npm run package
```
Produces a .vsix using the webpack bundle.

## Credits

I, as many, have been using the excellent [Task Explorer](https://marketplace.visualstudio.com/items?itemName=spmeesseman.vscode-taskexplorer) by Scott Meesseman but unfortunately the extension recently stopped working (independently from the switch to trial/paid version), so I decided to fill the gap with this small exercise, born more for my own convenience that I hope will also help someone else out there.
