# Task Explorer (Preview)

Task Explorer is a VS Code extension that surfaces your defined tasks in a dedicated sidebar view so you can browse and run them quickly.

## Features
- Sidebar view showing available VS Code tasks grouped by type (npm, shell, PowerShell, etc.)
- Inline hover actions on each task: run/stop (state-aware) and edit (opens tasks.json)
- Command palette actions to refresh the list and run/stop/edit a task
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
