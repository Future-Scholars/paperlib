//
//  MenuButtons.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import SwiftUI
import RealmSwift

struct MenuButtons: View {
    @Environment(\.injected) private var injected: DIContainer

    @State private var isDeleteConfirmationViewShown = false
    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    var body: some View {
        content()
    }

    func content() -> some View {
        switch selectedEntities {
        case .notRequested: return AnyView(notRequestedView())
        case .isLoading: return AnyView(loadingView())
        case .loaded: return AnyView(loadedView())
        case .failed: return AnyView(failedView())
        }
    }

}

// MARK: -

private extension MenuButtons {
    func notRequestedView() -> some View {
        return menuButtons(allDisabled: true)
    }

    func failedView() -> some View {
        return menuButtons(allDisabled: true)
    }

    func loadingView() -> some View {
        return menuButtons(allDisabled: false)
    }

    func loadedView() -> some View {
        return menuButtons(allDisabled: false)
    }

    func menuButtons(allDisabled: Bool) -> some View {
        HStack {
            HStack {
                // Open
                Button(
                    action: openSelectedEntities,
                    label: {
                        Image(systemName: "doc.text.magnifyingglass")
                    }
                )
                    .keyboardShortcut(.defaultAction)
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 <= 0)
                    .hidden()

                // Export
                Button(
                    action: {
                        exportSelectedEntities(format: .bibtex)
                    },
                    label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                )
                    .keyboardShortcut("c", modifiers: [.command, .shift])
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 <= 0)
                    .hidden()
            }

            HStack {
                // Scrape
                Button(
                    action: scrapeSelectedEntities,
                    label: {
                        Image(systemName: "doc.text.magnifyingglass")
                    }
                )
                    .keyboardShortcut("r")
                    .help("Scrape Metadatas")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 <= 0)

                // Delete
                Button(
                    action: {
                        isDeleteConfirmationViewShown = true
                    },
                    label: {
                        Image(systemName: "trash")
                    }
                )
                    .confirmationDialog("Are you sure to delete?", isPresented: $isDeleteConfirmationViewShown) {
                        Button("Yes", role: .destructive, action: {
                            deleteSelectedEntities()
                            isDeleteConfirmationViewShown = false
                        })
                        Button("No", role: .cancel, action: {
                            isDeleteConfirmationViewShown = false
                        })
                    }
                    .keyboardShortcut(.delete)
                    .help("Delete")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 <= 0)

                // Edit
                Button(
                    action: editSelectedEntities,
                    label: {
                        Image(systemName: "pencil.circle")
                    }
                )
                    .keyboardShortcut("e")
                    .help("Edit")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 != 1)

                // Flag
                Button(
                    action: flagSelectedEntities,
                    label: {
                        Image(systemName: "flag")
                    }
                )
                    .keyboardShortcut("g")
                    .help("Toggle Flag")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 <= 0)

                // Tag
                Button(
                    action: tagSelectedEntities,
                    label: {
                        Image(systemName: "tag")
                    }
                )
                    .keyboardShortcut("t")
                    .help("Edit Tags")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 != 1)

                // Folder
                Button(
                    action: folderSelectedEntities,
                    label: {
                        Image(systemName: "folder.badge.plus")
                    }
                )
                    .keyboardShortcut("f")
                    .help("Edit Folders")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 != 1)

                // Note
                Button(
                    action: noteSelectedEntities,
                    label: {
                        Image(systemName: "note.text.badge.plus")
                    }
                )
                    .keyboardShortcut("n")
                    .help("Edit Note")
                    .disabled(allDisabled || selectedEntities.value?.count ?? -1 != 1)
            }

            Picker("", selection: injected.sharedState.viewState.entitiesViewSwitcher.binding) {
                ForEach([0, 1], id: \.self) {
                    if $0 == 0 {
                        Image(systemName: "list.dash")
                    } else {
                        Image(systemName: "tablecells")
                    }
                }
            }
                .pickerStyle(SegmentedPickerStyle())
                .help("Switch View Mode")
                .padding(.leading, 15)

            Menu {
                Button("Title", action: {
                    changeSortBy("title")
                })
                Button("Year", action: {
                    changeSortBy("pubTime")
                })
                Button("Add Time", action: {
                    changeSortBy("addTime")
                })
            } label: {
                Label("sort", systemImage: "list.bullet.indent")
            }
                .help("Sort by")

            Button("Debug", action: injected.interactors.entitiesInteractor.debug)
        }
    }
}

// MARK: - Side Effect
private extension MenuButtons {

    func openSelectedEntities () {
        if let selectedEntities = selectedEntities.value {
            selectedEntities.forEach { entity in
                if let url = getJoinedURL(entity.mainURL) {
                    NSWorkspace.shared.open(url)
                }
            }
        }
    }

    func exportSelectedEntities (format: ExportFormat) {
        if let selectedEntities = selectedEntities.value {
            injected.interactors.entitiesInteractor.export(entities: Array(selectedEntities), format: format)
        }
    }

    func scrapeSelectedEntities () {
        if let selectedEntities = selectedEntities.value {
            let selectedEntitiesDraft = Array(selectedEntities).map({entity in PaperEntityDraft(from: entity)})
            injected.interactors.entitiesInteractor.scrape(entities: selectedEntitiesDraft)
        }
    }

    func deleteSelectedEntities () {
        if let selectedEntities = selectedEntities.value {
            let ids = Set(selectedEntities.map({entity in entity.id}))
            injected.interactors.entitiesInteractor.delete(ids: ids)

            $selectedEntities.wrappedValue = .notRequested
            injected.sharedState.selection.selectedIds.value = Set<ObjectId>.init()
        }
    }

    func editSelectedEntities () {
        if let selectedEntity = selectedEntities.value?.first {
            let entityDraft = PaperEntityDraft(from: selectedEntity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isEditViewShown.value = true
        }
    }

    func flagSelectedEntities () {
        if let selectedEntities = selectedEntities.value {
            let selectedEntitiesDraft = Array(selectedEntities)
                .map({entity in PaperEntityDraft(from: entity)})
                .map({entity -> PaperEntityDraft in
                    entity.flag.toggle()
                    return entity
                })
            injected.interactors.entitiesInteractor.update(entities: selectedEntitiesDraft)
        }
    }

    func tagSelectedEntities () {
        if let selectedEntity = selectedEntities.value?.first {
            let entityDraft = PaperEntityDraft(from: selectedEntity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isTagViewShown.value = true
        }
    }

    func folderSelectedEntities () {
        if let selectedEntity = selectedEntities.value?.first {
            let entityDraft = PaperEntityDraft(from: selectedEntity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isFolderViewShown.value = true
        }
    }

    func noteSelectedEntities () {
        if let selectedEntity = selectedEntities.value?.first {
            let entityDraft = PaperEntityDraft(from: selectedEntity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isNoteViewShown.value = true
        }
    }

    func changeSortBy(_ sortBy: String) {
        injected.sharedState.viewState.entitiesViewSortSwitcher.value = sortBy
    }

}
