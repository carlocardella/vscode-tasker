# Change Log

All notable changes to the "Task Explorer" extension will be documented in this file.

## [0.0.5] - 2026-02-04

### Added
- Task grouping by name prefix with configurable separator
- New settings: tasker.groupTasksByName, tasker.groupSeparator, tasker.exclude
- Tests for name grouping, custom separators, and process tasks

### Thanks
- Thanks to @thomas81528262 for the PR and improvements

## [0.0.4] - 2026-01-22

### Fixed
- Fixed expand button by implementing getParent method in TreeDataProvider for proper tree traversal


## [0.0.3] - 2026-01-22

### Fixed
- Fixed missing extension icon

## [0.0.2] - 2026-01-21

### Added
- Comprehensive test suite with 26 passing tests covering all major components
- Smart edit functionality that opens tasks at their correct file locations:
  - npm scripts open in package.json
  - gulp tasks open in gulpfile.js (supports .js, .ts, .babel.js)
  - grunt tasks open in Gruntfile.js (.js or .coffee)
  - shell/process tasks open the referenced script files
  - Other tasks open in tasks.json
- Error handling and fallback mechanism for icon rendering to prevent tree display failures

### Fixed
- Task type icons now display correctly using only verified VS Code Codicons (package, terminal-bash, terminal-powershell, wrench, server, gear, ruby)
- Removed invalid Codicon names that were causing silent rendering failures
- Added try-catch error handling for icon creation with safe 'package' icon fallback
- TypeScript compilation configuration for test suite (added skipLibCheck to tsconfig.tests.json)
- Extension identifier reference in test suite (updated to carlocardella.vscode-tasker)
- Cursor positioning in edit task command now points to exact task definitions in source files

## [0.0.1] - 2026-01-19

### Added
- Initial preview release
- Task Explorer sidebar view showing all available VS Code tasks
- Command to refresh task list
- Command to run selected tasks
- Webpack bundling for optimized extension size
- Basic test harness with @vscode/test-electron
- Group tasks by type (npm, shell, PowerShell, etc.) in the sidebar
- Inline hover actions to run/stop tasks and open tasks.json for editing
- Running-state tracking so the run button becomes a stop button while executing
- Custom extension logos with colorful checklist design and spinning repo-sync arrows
- Task type-specific icons for individual tasks (npm, PowerShell, Python, Docker, etc.)
- Monochrome outline logo for the activity bar that adapts to VS Code themes
