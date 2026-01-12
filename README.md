# Excalidraw Desktop
Unofficial desktop client for Excalidraw on Windows & MacOS. This version includes a local workspace management system and an updated UI.

![Excalidraw Desktop Workspace](./resources/screenshot.png)

## Key Features

- **Local Workspace**: Manage `.excalidraw` files directly from the sidebar.
- **Updated UI**: Interface built with Tailwind CSS and Lucide Icons.
- **Local File Saving**: "Save to disk" operations are intercepted to save directly to `~/Documents/Excalidraw-Desktop` without prompts.
- **Workspace Sync**:
  - **Inline Renaming**: Rename files in the sidebar with automatic state synchronization.
  - **File Duplication**: Create file copies with a single click.
  - **Auto-Save**: Background saving every 15 seconds. Auto-saved files are prefixed with `[auto]`.
- **Status Notifications**: Feedback for save, rename, copy, and delete operations.
- **Keyboard Shortcuts**: Support for **Ctrl/Cmd + S** to save directly to the local workspace.
- **Search**: Filter drawings by name in the sidebar.
- **Folder Access**: Quick access to the local drawings folder via the sidebar.

# Installation
Head over to the [releases page](https://github.com/pgkt04/excalidraw-desktop/releases/). Follow these steps:
1. Visit the [Releases](https://github.com/pgkt04/excalidraw-desktop/releases/) page.
2. Download the appropriate installer for your operating system.
3. Once downloaded, run the installer and follow the instructions.

## MacOS Users
If you get the error "Is Damaged and Can’t Be Opened. You Should Move It To The Bin", run the following command:
```bash
xattr -c /Applications/Excalidraw.app
```
This occurs because the application is not notarized.

# Development or Building
Ensure you have Node.js (v14.x or higher) and npm installed.

### Clone the repository:
```bash
git clone https://github.com/pgkt04/excalidraw-desktop.git
cd excalidraw-desktop
```

### Install dependencies:
```bash
npm install
```

## Running
Run the app in development mode:
```bash
npm run start
```

## Building
To create production installers:
```bash
npm run dist
```
Installers will be generated in the `dist` folder.
