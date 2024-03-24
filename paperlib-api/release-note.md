# Paperlib API Release Note

## v0.1.5

- update `PLAPI.fileService.move`: add two options `moveMain` and `moveSups`.
- update `PLAPI.fileService.moveFile`: remove two options `fourceDelete` and `forceNotLink`.
- new Event `dataContextMenuRemoveFromClicked` for `PLMainAPI.contextMenuService`.
- update `PLAPI.paperService.update`: add `isUpdate` option.
- add `PLAPI.paperService.updateMainURL`
- add `PLAPI.paperService.updateSupURLs`

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
