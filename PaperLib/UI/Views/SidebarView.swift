//
//  Sidebar.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

struct SidebarView: View {
    @Environment(\.injected) private var injected: DIContainer
    @Binding var selectedFilters: Set<String>

    @State private var showProgressView: Bool = false

    // Tags
    @State private var tags: Loadable<Results<PaperTag>>
    @State private var tagExpanded: Bool = true
    // Folders
    @State private var folders: Loadable<Results<PaperFolder>>
    @State private var folderExpanded: Bool = true

    @Binding private var statusText: String

    init(selectedFilters: Binding<Set<String>>, statusText: Binding<String>) {
        _tags = .init(initialValue: Loadable<Results<PaperTag>>.notRequested)
        _folders = .init(initialValue: Loadable<Results<PaperFolder>>.notRequested)
        _selectedFilters = selectedFilters
        _statusText = statusText
    }

    var body: some View {
        List(selection: $selectedFilters) {
            sectionTitle("Library")
            HStack {
                Label("All Papers", systemImage: "rectangle.stack")
                if showProgressView {
                    Spacer()
                    Text("     ")
                        .overlay {
                            ProgressView()
                                .scaleEffect(x: 0.5, y: 0.5, anchor: .center)
                        }
                }
            }
            .tag("lib-all")

            Label("Flags", systemImage: "flag").tag("lib-flag")

            TagContent()
            FolderContent()

        }
        .onAppear(perform: {
            reloadTags()
            reloadFolders()
        })
        .onReceive(processingStateUpdate, perform: { _ in
            if injected.appState[\.receiveSignals.processingCount] > 0 {
                showProgressView = true
            } else {
                showProgressView = false
            }
        })
        .onReceive(appLibMovedUpdate, perform: { _ in
            if injected.appState[\.setting.settingOpened], injected.appState[\.receiveSignals.sideBar] > 0 {
                injected.appState[\.receiveSignals.sideBar] -= 1
                reloadTags()
                reloadFolders()
            }
        })

        Spacer()
        Text(statusText).font(.footnote).foregroundColor(Color.primary.opacity(0.4)).frame(alignment: .center).padding(.bottom, 10)
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

    func failedView(_: Error) -> some View {
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
                    ForEach(tags) { tag in
                        Label(tag.name, systemImage: "tag")
                            .contextMenu {
                                Button("Remove", action: {
                                    removeTag(tagName: tag.name)
                                })
                            }
                            .tag("tag-\(tag.name)")
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
                    ForEach(folders) { folder in
                        Label(folder.name, systemImage: "folder")
                            .contextMenu {
                                Button("Remove", action: {
                                    removeFolder(folderName: folder.name)
                                })
                            }
                            .tag("folder-\(folder.name)")
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
    func reloadTags() {
        injected.interactors.entitiesInteractor.load(categorizers: $tags, cancelBagKey: "categorizers")
    }

    func reloadFolders() {
        injected.interactors.entitiesInteractor.load(categorizers: $folders, cancelBagKey: "categorizers")
    }

    func removeTag(tagName: String) {
        injected.interactors.entitiesInteractor.delete(categorizerName: tagName, categorizerType: PaperTag.self)
    }

    func removeFolder(folderName: String) {
        injected.interactors.entitiesInteractor.delete(categorizerName: folderName, categorizerType: PaperFolder.self)
    }

    var appLibMovedUpdate: AnyPublisher<Date, Never> {
        injected.appState.updates(for: \.receiveSignals.appLibMoved)
    }

    var processingStateUpdate: AnyPublisher<Int, Never> {
        injected.appState.updates(for: \.receiveSignals.processingCount)
    }
}
