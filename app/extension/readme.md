# Extension Architecture

## Extension Types

### Pure commandline extension

The entry is commands in the command bar. Logic is in the extension process. only call exposed APIs. e.g., Check duplicated papers and show them.

```
                       /--> main process
                      |          ^
 extension process <--|          |
                      |          v
                       \--> renderer process
```

### UI modification extension

Usually triggered by some exposed hooks. Logic is in the extension process. Will modify some exposed slots in the UI. e.g., add a section to the details panel.

```
                       /--> main process
                      |          ^
 extension process <--|          |
                      |          v
                       \--> renderer process
```

### New window extension

This kind of extension will open a new window. Logic is in the extension, or the new window renderer process. e.g., quickcopy extension.

```
                                             /--> main process
                                            |          ^
new window process <-> extension process <--|          |
                                            |          v
                                             \--> renderer process
```

## Exposed APIs

- main process: `PLMainAPI`
- renderer process: `PLAPI`
- extension process: `PLExtensionAPI`
- new window process: `PLNewWindowAPI`, should create for each new window, and expose to the extension who create it.
