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
    @AppStorage("showSidebarCount") private var showSidebarCount = true

    @State private var entitiesCount: Int = 0
    @State private var isProgressViewShown: Bool = false

    // Tags
    @Binding var tags: Loadable<Results<PaperTag>>
    @State private var tagExpanded: Bool = true
    // Folders
    @Binding var folders: Loadable<Results<PaperFolder>>
    @State private var folderExpanded: Bool = true

    var body: some View {
        List(selection: injected.sharedState.selection.selectedCategorizer.binding) {
            sectionTitle("Library")
            HStack {
                Label("All Papers", systemImage: "rectangle.stack")
                Spacer()
                if isProgressViewShown {
                    Spacer()
                    Text("     ")
                        .overlay {
                            ProgressView()
                                .scaleEffect(x: 0.5, y: 0.5, anchor: .center)
                        }
                }
                if showSidebarCount {
                    Text("\(entitiesCount)")
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .frame(minWidth: 22)
                        .font(.caption)
                        .background(Color.secondary.opacity(0.2))
                        .clipShape(Capsule())
                        .onReceive(injected.sharedState.viewState.entitiesCount.publisher, perform: { entitiesCount in
                            self.entitiesCount = entitiesCount
                        })
                }
            }
            .tag("lib-all")

            Label("Flags", systemImage: "flag").tag("lib-flag")

            TagContent()
            FolderContent()

        }
        .onReceive(injected.sharedState.viewState.processingQueueCount.publisher, perform: { processingQueueCount in
            if processingQueueCount > 0 {
                isProgressViewShown = true
            } else {
                isProgressViewShown = false
            }
        })
        .toolbar {
            ToolbarItem(placement: ToolbarItemPlacement.status) {
                Button(
                    action: {
                        NSApp.keyWindow?.firstResponder?.tryToPerform(
                            #selector(NSSplitViewController.toggleSidebar(_:)), with: nil
                        )
                    },
                    label: {
                        Label("Toggle Sidebar", systemImage: "sidebar.left")
                    }
                )
            }
        }

        Spacer()
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
                        HStack {
                            Label(tag.name, systemImage: "tag")
                            Spacer()
                            if showSidebarCount {
                                Text("\(tag.count)")
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 2)
                                    .frame(minWidth: 22)
                                    .font(.caption)
                                    .background(Color.secondary.opacity(0.2))
                                    .clipShape(Capsule())
                            }
                        }
                            .contextMenu {
                                Button("Remove", action: {
                                    removeTag(tagName: tag.name)
                                })
                            }
                            .tag("tag-\(tag.name)")
                            .onDrop(of: ["public.url"], isTargeted: nil) { providers -> Bool in
                                onDropEntitiesToTag(providers: providers, tag: "\(tag.name)")
                                return true
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
                    ForEach(folders) { folder in
                        HStack {
                            Label(folder.name, systemImage: "folder")
                            Spacer()
                            if showSidebarCount {
                                Text("\(folder.count)")
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 2)
                                    .frame(minWidth: 22)
                                    .font(.caption)
                                    .background(Color.secondary.opacity(0.2))
                                    .clipShape(Capsule())
                            }
                        }
                            .contextMenu {
                                Button("Remove", action: {
                                    removeFolder(folderName: folder.name)
                                })
                            }
                            .tag("folder-\(folder.name)")
                            .onDrop(of: ["public.url"], isTargeted: nil) { providers -> Bool in
                                onDropEntitiesToFolder(providers: providers, folder: "\(folder.name)")
                                return true
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
    func onDropEntitiesToTag(providers: [NSItemProvider], tag: String) {
        let urlGroup = DispatchGroup()

        var urlList: [URL] = .init()
        providers.forEach { provider in
            urlGroup.enter()
            provider.loadDataRepresentation(forTypeIdentifier: "public.url", completionHandler: { data, _ in
                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                    urlList.append(url)
                    urlGroup.leave()
                }
            })
        }

        urlGroup.notify(queue: .main) {
            if urlList.count > 0 {
                let ids = urlList.map({url in try? ObjectId(string: url.absoluteString.replacingOccurrences(of: "entity://", with: ""))}).filter({id in id != nil}).map({id in id!})
                injected.interactors.entitiesInteractor.tag(ids: ids, tag: tag)
            }
        }
    }

    func onDropEntitiesToFolder(providers: [NSItemProvider], folder: String) {
        let urlGroup = DispatchGroup()

        var urlList: [URL] = .init()
        providers.forEach { provider in
            urlGroup.enter()
            provider.loadDataRepresentation(forTypeIdentifier: "public.url", completionHandler: { data, _ in
                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                    urlList.append(url)
                    urlGroup.leave()
                }
            })
        }

        urlGroup.notify(queue: .main) {
            if urlList.count > 0 {
                let ids = urlList.map({url in try? ObjectId(string: url.absoluteString.replacingOccurrences(of: "entity://", with: ""))}).filter({id in id != nil}).map({id in id!})
                injected.interactors.entitiesInteractor.folder(ids: ids, folder: folder)
            }
        }
    }

    func removeTag(tagName: String) {
        injected.interactors.entitiesInteractor.delete(categorizerName: tagName, categorizerType: PaperTag.self)
    }

    func removeFolder(folderName: String) {
        injected.interactors.entitiesInteractor.delete(categorizerName: folderName, categorizerType: PaperFolder.self)
    }
}
