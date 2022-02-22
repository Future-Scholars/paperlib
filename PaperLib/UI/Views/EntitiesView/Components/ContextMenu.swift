//
//  ContextMenu.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import SwiftUI
import RealmSwift

struct ContextMenu: View {
    @Environment(\.injected) private var injected: DIContainer

    let clickedEntity: PaperEntity

    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    var body: some View {
        content()
    }

    func content() -> some View {
        switch selectedEntities {
        case .notRequested: return AnyView(loadedView())
        case .isLoading: return AnyView(loadedView())
        case .loaded: return AnyView(loadedView())
        case .failed: return AnyView(loadedView())
        }
    }
}

private extension ContextMenu {

    func loadedView() -> some View {
        VStack {
            HStack {
                Button("Open", action: openSelectedEntities)
                    .keyboardShortcut(.defaultAction)

                Button("Edit", action: editSelectedEntities)
                    .keyboardShortcut("e")
                    .disabled(selectedEntities.value?.filter({ entity in entity.id == clickedEntity.id}).count ?? -1 > 0 && selectedEntities.value?.count ?? 0 > 1)

                Button("Scrape", action: scrapeSelectedEntities)
                    .keyboardShortcut("r")

                Button("Delete", action: deleteSelectedEntities)
                    .keyboardShortcut(.delete)
            }

            Divider()

            HStack {
                Button("Toggle Flag", action: flagSelectedEntities)
                    .keyboardShortcut("f")

                Button("Add Tags", action: tagSelectedEntities)
                    .keyboardShortcut("t")
                    .disabled(selectedEntities.value?.filter({ entity in entity.id == clickedEntity.id}).count ?? -1 > 0 && selectedEntities.value?.count ?? 0 > 1)

                Button("Add Folders", action: folderSelectedEntities)
                    .keyboardShortcut("g")
                    .disabled(selectedEntities.value?.filter({ entity in entity.id == clickedEntity.id}).count ?? -1 > 0 && selectedEntities.value?.count ?? 0 > 1)

                Button("Add Notes", action: noteSelectedEntities)
                    .keyboardShortcut("n")
                    .disabled(selectedEntities.value?.filter({ entity in entity.id == clickedEntity.id}).count ?? -1 > 0 && selectedEntities.value?.count ?? 0 > 1)
            }

            Divider()

            Menu("Copy to Clipboard") {
                Button("Bibtex", action: {
                    exportSelectedEntities(format: .bibtex)
                })
                    .keyboardShortcut("c", modifiers: [.command, .shift])
                Button("Plain Text", action: {
                    exportSelectedEntities(format: .plain)
                })
            }
        }
    }
}

// MARK: - Side Effect
private extension ContextMenu {

    func handelingEntities () -> [PaperEntity] {
        if let selectedEntities = selectedEntities.value, (selectedEntities.count > 1 && (selectedEntities.filter({ entity in entity.id == clickedEntity.id}).count > 0)) {
            return Array(selectedEntities)
        } else {
            return [clickedEntity]
        }
    }

    func openSelectedEntities () {
        let selectedEntities = handelingEntities()
        selectedEntities.forEach { entity in
            if let url = getJoinedURL(entity.mainURL) {
                NSWorkspace.shared.open(url)
            }
        }
    }

    func editSelectedEntities () {
        let selectedEntities = handelingEntities()

        if let entity = selectedEntities.first {
            let entityDraft = PaperEntityDraft(from: entity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isEditViewShown.value = true
        }
    }

    func scrapeSelectedEntities () {
        let selectedEntities = handelingEntities()
        let selectedEntitiesDraft = selectedEntities.map({entity in PaperEntityDraft(from: entity)})
        injected.interactors.entitiesInteractor.scrape(entities: selectedEntitiesDraft)
    }

    func deleteSelectedEntities () {
        let selectedEntities = handelingEntities()

        let ids = Set(selectedEntities.map({entity in entity.id}))
        injected.interactors.entitiesInteractor.delete(ids: ids)

        $selectedEntities.wrappedValue = .notRequested
        injected.sharedState.selection.selectedIds.value = Set<ObjectId>.init()
    }

    func flagSelectedEntities () {
        let selectedEntities = handelingEntities()

        let selectedEntitiesDraft = selectedEntities
            .map({entity in PaperEntityDraft(from: entity)})
            .map({entity -> PaperEntityDraft in
                entity.flag.toggle()
                return entity
            })
        injected.interactors.entitiesInteractor.update(entities: selectedEntitiesDraft)
    }

    func tagSelectedEntities () {
        let selectedEntities = handelingEntities()

        if let entity = selectedEntities.first {
            let entityDraft = PaperEntityDraft(from: entity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isTagViewShown.value = true
        }
    }

    func folderSelectedEntities () {
        let selectedEntities = handelingEntities()

        if let entity = selectedEntities.first {
            let entityDraft = PaperEntityDraft(from: entity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isFolderViewShown.value = true
        }
    }

    func noteSelectedEntities () {
        let selectedEntities = handelingEntities()

        if let entity = selectedEntities.first {
            let entityDraft = PaperEntityDraft(from: entity)
            injected.sharedState.sharedData.editEntityDraft.value = entityDraft
            injected.sharedState.viewState.isNoteViewShown.value = true
        }
    }

    func exportSelectedEntities (format: ExportFormat) {
        let selectedEntities = handelingEntities()

        injected.interactors.entitiesInteractor.export(entities: selectedEntities, format: format)
    }
}
