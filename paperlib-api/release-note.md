# Paperlib API Release Note

## v0.1.2

- add `updateCache` option for `PLAPI.paperService.update

## v0.1.1

- `PLAPI.networkTool` has been removed.
- a new preference `mainviewShortAuthor`.
- add `exportBibTexBodyInFolder` for `PLAPI.ReferenceService`.
- add `exportPlainTextInFolder` for `PLAPI.ReferenceService`.

## v0.0.16

- `PLAPI.networkTool` is deprecated. Use `PLExtAPI.networkTool` instead.
- `PLExtAPI.networkTool`:
  - `.get`, `.post`, `.postForm` has a new argument `parse` to force returen a parsed JSON object. Otherwise, the type of the response body is determined by the `Content-Type` header.
