//
//  Sidebar.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import SwiftUI
import Combine
import RealmSwift


struct SidebarView: View {
    @Environment(\.injected) private var injected: DIContainer
    @Binding var selectedFilters: Set<String>
    
    // Tags
    @State private var tags: Loadable<Results<PaperTag>>
    @State private var tagExpanded: Bool = true
    // Folders
    @State private var folders: Loadable<Results<PaperFolder>>
    @State private var folderExpanded: Bool = true

    init(selectedFilters: Binding<Set<String>>) {
        self._tags = .init(initialValue: Loadable<Results<PaperTag>>.notRequested)
        self._folders = .init(initialValue: Loadable<Results<PaperFolder>>.notRequested)
        self._selectedFilters = selectedFilters
    }
    
    var body: some View {
        EmptyView()
        List (selection: $selectedFilters) {
            sectionTitle("Library")
            Label("All Papers", systemImage: "book").tag("lib-all")
            Label("Flags", systemImage: "flag").tag("lib-flag")
            
            TagContent()
            FolderContent()

        }
        .onAppear(perform: {
            reloadTags()
            reloadFolders()
        })
        .onReceive(appLibMovedUpdate, perform: {_ in
            if (injected.appState[\.setting.settingOpened] && injected.appState[\.receiveSignals.sideBarTag] > 0 && injected.appState[\.receiveSignals.sideBarFolder] > 0) {
                reloadTags()
                reloadFolders()
                injected.appState[\.receiveSignals.sideBarTag] -= 1
                injected.appState[\.receiveSignals.sideBarFolder] -= 1
            }
        })
    }

    private func TagContent() -> AnyView {
        switch tags {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(tagLoadingView(last))
        case let .loaded(tags): return AnyView(tagLoadedView(tags))
        case let .failed(error): return AnyView(failedView(error))
        }
    }
    
    private func FolderContent() -> AnyView {
        switch folders {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(folderLoadingView(last))
        case let .loaded(folders): return AnyView(folderLoadedView(folders))
        case let .failed(error): return AnyView(failedView(error))
        }
    }
    
}

private extension SidebarView {
    func notRequestedView() -> some View {
        EmptyView()
    }
    
    func failedView(_ error: Error) -> some View {
        EmptyView()
    }

    // Tag
    func tagLoadingView(_ previouslyLoaded: Results<PaperTag>?) -> some View {
        if let tags = previouslyLoaded {
            return AnyView(tagLoadedView(tags))
        } else {
            return AnyView(EmptyView())
        }
    }
    
    func tagLoadedView(_ tags: Results<PaperTag>) -> some View {
        return AnyView(
            DisclosureGroup(
                isExpanded: $tagExpanded,
                content: {
                    ForEach(tags) {tag in
                        Label(tag.name, systemImage: "tag")
                            .contextMenu {
                                Button("Remove", action: {
                                    removeTag(tagId: tag.id)
                                })
                            }
                    }
                },
                label: { sectionTitle("Tags") }
            )
        )
    }
    
    // Folder
    func folderLoadingView(_ previouslyLoaded: Results<PaperFolder>?) -> some View {
        if let folders = previouslyLoaded {
            return AnyView(folderLoadedView(folders))
        } else {
            return AnyView(EmptyView())
        }
    }
    
    func folderLoadedView(_ folders: Results<PaperFolder>) -> some View {
        return AnyView(
            DisclosureGroup(
                isExpanded: $folderExpanded,
                content: {
                    ForEach(folders) {folder in
                        Label(folder.name, systemImage: "folder")
                            .contextMenu {
                                Button("Remove", action: {
                                    removeFolder(folderId: folder.id)
                                })
                            }
                    }
                },
                label: { sectionTitle("Folders") }
            )
        )
    }
    
    func sectionTitle(_ text: String) -> some View {
        return Text(text)
            .bold()
            .font(.subheadline)
            .foregroundColor(Color.secondary.opacity(0.8))
    }
    

}


// MARK: - Side Effects

private extension SidebarView {
    
    func reloadTags () {
        injected.interactors.entitiesInteractor.load(tags: $tags, cancelBagKey: nil)
    }
    
    func reloadFolders () {
        injected.interactors.entitiesInteractor.load(folders: $folders, cancelBagKey: nil)
    }
    
    func removeTag (tagId: String) {
        injected.interactors.entitiesInteractor.delete(tagId: tagId)
    }
    
    func removeFolder (folderId: String) {
        injected.interactors.entitiesInteractor.delete(folderId: folderId)
    }

    var appLibMovedUpdate: AnyPublisher<Date, Never> {
        injected.appState.updates(for: \.setting.appLibMoved)
    }
    
}
