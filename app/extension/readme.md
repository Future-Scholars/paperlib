# Extension Types:

## Pure commandline extension

The entry is commands in the command bar. Logic is in the extension process. only call exposed APIs. e.g., Check duplicated papers and show them.

### RPC

```
extension process <-> renderer/main process
```

## UI modification extension

Usually triggered by some exposed hooks. Logic is in the extension process. Will modify some exposed slots in the UI. e.g., add a section to the details panel.

### RPC

```
extension process <-> renderer/main process
```

## New window extension

This kind of extension will open a new window. Logic is in the extension, or the new window renderer process. e.g., quickcopy extension.

### RPC

```
extension process <-> renderer/main process
            ^             ^
             \           /
              v         v
       new window renderer process

```
