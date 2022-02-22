//
//  MainView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

struct MainView: View {
    @Environment(\.injected) private var injected: DIContainer
    private var cancelbag = CancelBag()

    // Common
    @State private var entities: Loadable<Results<PaperEntity>>
    @State private var selectedEntities: Loadable<Results<PaperEntity>>
    @State private var tags: Loadable<Results<PaperTag>>
    @State private var folders: Loadable<Results<PaperFolder>>

    @State private var selectedEntitiesDraft: [PaperEntityDraft] = .init()

    @State private var mainViewSortSwitcher: String = "addTime"

    @State private var isEditViewShown: Bool = false
    @State private var isTagViewShown: Bool = false
    @State private var isFolderViewShown: Bool = false
    @State private var isNoteViewShown: Bool = false
    @State private var isAlertShown: Bool = false

    @State private var alertInformation: String = ""

    init() {
        _entities = .init(initialValue: Loadable<Results<PaperEntity>>.notRequested)
        _selectedEntities = .init(initialValue: Loadable<Results<PaperEntity>>.notRequested)
        _tags = .init(initialValue: Loadable<Results<PaperTag>>.notRequested)
        _folders = .init(initialValue: Loadable<Results<PaperFolder>>.notRequested)
    }

    var body: some View {
        NavigationView {
            // MARK: - Sidebar

            SidebarView(tags: $tags, folders: $folders)
                .frame(minWidth: 300)

            // MARK: - Main list

            HStack(spacing: 0) {
                EntitiesView(entities: $entities, selectedEntities: $selectedEntities)
                    .sheet(isPresented: $isEditViewShown, content: { EditView() })
                    .sheet(isPresented: $isTagViewShown, content: { TagEditView(tags: $tags) })
                    .sheet(isPresented: $isFolderViewShown, content: { FolderEditView(folders: $folders) })
                    .sheet(isPresented: $isNoteViewShown, content: { NoteEditView() })
                    .onReceive(injected.sharedState.selection.selectedCategorizer.publisher, perform: { selectedCategorizer in
                        if selectedCategorizer != nil { reloadEntities() }
                    })
                    .onReceive(injected.sharedState.viewState.entitiesViewSortSwitcher.publisher, perform: { entitiesViewSortSwitcher in
                        if entitiesViewSortSwitcher != nil { reloadEntities() }
                    })
                    .onReceive(injected.sharedState.viewState.isEditViewShown.publisher, perform: { isEditViewShown in
                        self.isEditViewShown = isEditViewShown
                    })
                    .onReceive(injected.sharedState.viewState.isTagViewShown.publisher, perform: { isTagViewShown in
                        self.isTagViewShown = isTagViewShown
                    })
                    .onReceive(injected.sharedState.viewState.isFolderViewShown.publisher, perform: { isFolderViewShown in
                        self.isFolderViewShown = isFolderViewShown
                    })
                    .onReceive(injected.sharedState.viewState.isNoteViewShown.publisher, perform: { isNoteViewShown in
                        self.isNoteViewShown = isNoteViewShown
                    })

                DetailView(entities: $selectedEntities)
                    .onReceive(injected.sharedState.selection.selectedIds.publisher, perform: { _ in
                        reloadSelectedEntities()
                    })

            }
            .toolbar {
                ToolbarView(selectedEntities: $selectedEntities)
                    .onReceive(injected.sharedState.sharedData.searchQuery.publisher, perform: { searchQuery in
                        if searchQuery != nil { reloadEntities() }
                    })
            }
            .alert(Text("An error occurred."), isPresented: $isAlertShown) {
                Button("OK") {
                    self.isAlertShown = false
                }
            } message: {
                Text(alertInformation)
            }
            .onReceive(injected.sharedState.viewState.alertInformation.publisher, perform: { alertInformation in
                if let alertInformation = alertInformation {
                    self.isAlertShown = true
                    self.alertInformation = alertInformation
                }
            })
            .onReceive(injected.sharedState.viewState.realmReinited.publisher, perform: { realmReinited in
                if realmReinited != nil {
                    clearSelected()
                    reloadEntities()
                    reloadTags()
                    reloadFolders()
                }
            })
            .onAppear(perform: {
                reloadEntities()
                reloadTags()
                reloadFolders()
            })
        }
    }
}

// MARK: - Side Effects

private extension MainView {

    func reloadEntities() {
        clearSelected()
        let (search, flag, tags, folders, sortBy) = makeFilter()
        injected.interactors.entitiesInteractor.load(
            entities: $entities,
            ids: nil,
            search: search,
            flag: flag,
            tags: tags,
            folders: folders,
            sort: sortBy,
            cancelBagKey: "entities"
        )
    }

    func reloadTags() {
        injected.interactors.entitiesInteractor.load(categorizers: $tags, cancelBagKey: "categorizer-tags")
    }

    func reloadFolders() {
        injected.interactors.entitiesInteractor.load(categorizers: $folders, cancelBagKey: "categorizer-folders")
    }

    func clearSelected() {
        $selectedEntities.wrappedValue = .notRequested
        injected.sharedState.selection.selectedIds.value = Set<ObjectId>.init()
    }

    func reloadSelectedEntities() {
        injected.interactors.entitiesInteractor.load(
            entities: $selectedEntities,
            ids: injected.sharedState.selection.selectedIds.value,
            search: "",
            flag: false,
            tags: [],
            folders: [],
            sort: mainViewSortSwitcher,
            cancelBagKey: "entitiesByIds"
        )
    }

    func makeFilter() -> (String, Bool, [String], [String], String) {
        let search = injected.sharedState.sharedData.searchQuery.value ?? ""

        let flag: Bool = injected.sharedState.selection.selectedCategorizer.value == "lib-flag"
        var tags: [String] = .init()
        var folders: [String] = .init()

        if let categorizer = injected.sharedState.selection.selectedCategorizer.value, categorizer.starts(with: "tag-") {
            tags.append(injected.sharedState.selection.selectedCategorizer.value!)
        }
        if let categorizer = injected.sharedState.selection.selectedCategorizer.value, categorizer.starts(with: "folder-") {
            folders.append(injected.sharedState.selection.selectedCategorizer.value!)
        }

        let sortBy = injected.sharedState.viewState.entitiesViewSortSwitcher.value ?? "addTime"

        return (search, flag, tags, folders, sortBy)
    }

}
