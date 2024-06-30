# Paperlib API Release Note

## v0.1.10

- add `deleteSlotItem` for `PLAPI.uiSlotService`.

## v0.1.9

- add `supContextMenuRenameClicked` for `PLMainAPI.contextMenuService`.
- `selectedQuerySentenceId` to `selectedQuerySentenceIds` in `UIStatesService`
- `querySentenceSidebar` to `querySentencesSidebar` in `UIStatesService`
- add `setSupDisplayName` for `PLAPI.paperService`.


## v0.1.8

- `PLMainAPI.wndowProcessManagementService.create` has a new argument `additionalHeaders`.
- `PLMainAPI.windowProcessManagementService.create` has some new methods:
  - `setParentWindow`
  - `getBounds`
  - `setBounds`
  - `hasParentWindow`
  - `setAlwaysOnTop`
  - `center`

## v0.1.7

- all functions in `referenceService` now receive a `PaperEntity[]` rather than a citation.js object.
- add `PLMainAPI.windowProcessManagementService.isFocused(...)` to check if a window is focused.

## v0.1.6

- add `dataContextMenuExportBibItemClicked` for `PLMainAPI.contextMenuService`.
- add new slot `overlayNotifications` for `PLAPI.UISlotService`.
- add `overlayNoticationShown` for `PLAPI.UIStateService`.
- remove `PLMainAPI.menuService.enableAll()` and `PLMainAPI.menuService.disableAll()`.
- add `PLMainAPI.menuService.disableGlobalShortcuts()`.
- add `PLAPI.referenceService.exportBibItem()`.

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
