//
//  MainView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

class MainViewModel: ObservableObject {
    @Published var selectedIds: Set<ObjectId> = .init()
    @Published var searchText: String = ""
}

struct MainView: View {
    @Environment(\.injected) private var injected: DIContainer
    private var cancelbag = CancelBag()
    // Common
    @State private var selectedEntities: Loadable<Results<PaperEntity>>
    @State private var selectedEntitiesDraft: [PaperEntityDraft] = .init()

    @State private var selectedEntitiesDraft_: Loadable<[PaperEntityDraft]>

    // Sidebar
    @State private var selectedFilters: Set<String> = .init()
    @State private var statusText: String = ""

    // Main List
    @StateObject private var mainState = MainViewModel()
    @State private var lastSearchText = ""
    @State private var entities: Loadable<Results<PaperEntity>>

    // Edit View
    @State private var showEditView: Bool = false

    // Tag Edit View
    @State private var showTagEditView: Bool = false

    // Folder Edit View
    @State private var showFolderEditView: Bool = false

    // Note Edit View
    @State private var showNoteEditView: Bool = false

    // Main View Switcher
    @State private var mainViewSwitcher: Int = 0
    @State private var mainViewSortSwitcher: String = "addTime"

    @State private var showConfirmationDelete: Bool = false

    init() {
        _entities = .init(initialValue: Loadable<Results<PaperEntity>>.notRequested)
        _selectedEntities = .init(initialValue: Loadable<Results<PaperEntity>>.notRequested)
        _selectedEntitiesDraft_ = .init(initialValue: Loadable<[PaperEntityDraft]>.notRequested)
    }

    var body: some View {
        NavigationView {
            // MARK: - Sidebar

            SidebarView(selectedFilters: $selectedFilters, statusText: $statusText)
                .inject(injected)
                .frame(minWidth: 300)
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
                .onChange(of: selectedFilters, perform: { _ in
                    clearSelected()
                    reloadEntities()
                })

            // MARK: - Main list

            HStack(spacing: 0) {
                mainContent()
                    .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in

                        DispatchQueue.global(qos: .background).async {
                            onDropFiletoMain(providers: providers)
                        }

                        return true
                    }
                detailContent()
                    .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                        onDropFiletoDetail(providers: providers)
                        return true
                    }
            }
            .toolbar {
                SearchBar(text: $mainState.searchText)
                    .onReceive(
                        mainState.$searchText
                            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
                    ) { searchText in
                        switch entities {
                        case .loaded:
                            do {
                                if searchText != self.lastSearchText {
                                    self.lastSearchText = searchText
                                    clearSelected()
                                    reloadEntities()
                                }
                                guard !searchText.isEmpty else { return }
                            }
                        default: return
                        }
                    }
                Spacer()
                menuButtons()
            }
            .onReceive(mainState.$selectedIds) { _ in
                if mainState.selectedIds.count > 0 {
                    self.statusText = "\(mainState.selectedIds.count) / \(entities.value!.count)"
                } else {
                    statusText = ""
                }
            }
            .onReceive(appLibMovedUpdate, perform: { _ in
                if injected.appState[\.receiveSignals.settingOpened], injected.appState[\.receiveSignals.mainView] > 0 {
                    injected.appState[\.receiveSignals.mainView] -= 1
                    reloadEntities()
                    clearSelected()
                }
            })
            .onAppear(perform: reloadEntities)
        }
    }

    private func mainContent() -> AnyView {
        switch entities {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(loadingView(last))
        case let .loaded(entities): return AnyView(loadedView(entities))
        case let .failed(error): return AnyView(failedView(error))
        }
    }

    private func detailContent() -> AnyView {
        return AnyView(DetailView(selectedEntitiesDraft: $selectedEntitiesDraft_))
    }
}

// MARK: - View

private extension MainView {
    // Main List
    func notRequestedView() -> some View {
        return EmptyView()
    }

    func failedView(_: Error) -> some View {
        EmptyView()
    }

    func loadingView(_ previouslyLoaded: Results<PaperEntity>?) -> some View {
        print("[Loading] entities")
        if let entities = previouslyLoaded {
            return AnyView(
                ZStack {
                    loadedView(entities)
                    ProgressView()
                }
            )
        } else {
            return AnyView(EmptyView())
        }
    }

    func loadedView(_ entities: Results<PaperEntity>) -> some View {
        if mainViewSwitcher == 0 {
            return AnyView(
                List(selection: $mainState.selectedIds) {
                    ForEach(entities.freeze()) { entity in
                        ListRow(entity: entity).frame(height: 55)
                            .contextMenu {
                                rowContextMenu()
                            }
                    }
                }
            )
        } else {
            return AnyView(
                Table(entities.freeze(), selection: $mainState.selectedIds) {
                    TableColumn("Title") { entity in
                        Text(entity.title).font(.subheadline)
                    }
                    TableColumn("Authors") { entity in
                        Text(entity.authors).font(.subheadline)
                    }
                    .width(min: 30, ideal: 100)
                    TableColumn("Publication") { entity in
                        Text(entity.publication).font(.subheadline)
                    }
                    TableColumn("Year") { entity in
                        Text(entity.pubTime).font(.subheadline)
                    }
                    .width(min: 50, ideal: 50, max: 50)
                    TableColumn("Flag") { entity in
                        if entity.flag {
                            Image(systemName: "flag.fill").opacity(0.8)
                        } else {
                            Image(systemName: "flag.fill").opacity(0)
                        }
                    }
                    .width(min: 50, ideal: 50, max: 50)
                }
                .contextMenu {
                    rowContextMenu()
                }
            )
        }
    }

    func rowContextMenu() -> some View {
        VStack {
            Button("Open", action: openEntities).keyboardShortcut(.defaultAction)
            Button("Edit", action: {
                reloadSelectedEntitiesDraft()
                self.showEditView.toggle()
            })
                .keyboardShortcut("e")
                .disabled(mainState.selectedIds.count != 1)
            Button("Match", action: scrapeEntities).keyboardShortcut("r")
            Button("Delete", action: deleteEntities).keyboardShortcut(.delete)

            Divider()

            Button("Toggle Flag", action: {
                editEntities(op: "flag")
            }).keyboardShortcut("g")
            Button("Add Tag", action: {
                reloadSelectedEntitiesDraft()
                self.showTagEditView.toggle()
            })
                .keyboardShortcut("t")
                .disabled(mainState.selectedIds.count != 1)
                .sheet(isPresented: $showTagEditView, content: { tagEditView() })
            Button("Add Folder", action: {
                reloadSelectedEntitiesDraft()
                self.showFolderEditView.toggle()
            })
                .keyboardShortcut("g")
                .disabled(mainState.selectedIds.count != 1)
                .sheet(isPresented: $showFolderEditView, content: { folderEditView() })

            Divider()

            Menu("Export") {
                Button("Bibtex", action: {
                    exportEntities(format: .bibtex)
                })
                Button("Plain Text", action: {
                    exportEntities(format: .plain)
                })
            }
        }
    }

    // Detail View
//    func detailLoadingView(_ previouslyLoaded: Results<PaperEntity>?) -> some View {
//        if let entities = previouslyLoaded {
//            return AnyView(
//                ZStack {
//                    detailLoadedView(entities)
//                    ProgressView()
//                })
//        } else {
//            return AnyView(EmptyView())
//        }
//    }
//
//    func detailLoadedView(_ entities: Results<PaperEntity>) -> some View {
//        if entities.count == 1 {
//            return AnyView(DetailView(entity: entities.first!).inject(injected))
//        } else {
//            return AnyView(EmptyView())
//        }
//    }

    // Edit View

    func editView() -> some View {
        return VStack {
            EditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button("Close", action: {
                    showEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })

                Spacer()
                Button("Save & Close", action: {
                    editEntities()
                    showEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })
            }.padding()
        }
    }

    // Tag Edit View
    func tagEditView() -> some View {
        return VStack {
            TagEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button("Close", action: {
                    showTagEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })

                Spacer()

                Button("Save & Close", action: {
                    editEntities()
                    showTagEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })
            }.padding()
        }
    }

    // Folder Edit View
    func folderEditView() -> some View {
        return VStack {
            FolderEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button("Close", action: {
                    showFolderEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })

                Spacer()

                Button("Save & Close", action: {
                    editEntities()
                    showFolderEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })
            }.padding()
        }
    }

    func noteEditView() -> some View {
        return VStack {
            NoteEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button("Close", action: {
                    showNoteEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })

                Spacer()

                Button("Save & Close", action: {
                    editEntities()
                    showNoteEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                })
            }.padding()
        }
    }

    // Menu Buttons
    func menuButtons() -> some View {
        HStack {
            HStack {
                // Open
                Button(
                    action: openEntities,
                    label: {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundColor(mainState.selectedIds.count == 0 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut(.defaultAction)
                    .disabled(mainState.selectedIds.count == 0)
                    .hidden()

                // Export
                Button(
                    action: {
                        exportEntities(format: .bibtex)
                    },
                    label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(Color.primary.opacity(0.5))
                    }
                )
                    .keyboardShortcut("c")
                    .disabled(mainState.selectedIds.count == 0)
                    .hidden()

                // Match
                Button(
                    action: scrapeEntities,
                    label: {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundColor(mainState.selectedIds.count == 0 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("r")
                    .help("Match Metadata")
                    .disabled(mainState.selectedIds.count == 0)

                // Delete
                Button(
                    action: {
                        showConfirmationDelete.toggle()
                    },
                    label: {
                        Image(systemName: "trash")
                            .foregroundColor(mainState.selectedIds.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .confirmationDialog("Are you sure to delete?", isPresented: $showConfirmationDelete) {
                        Button("Yes", action: {
                            showConfirmationDelete.toggle()
                            deleteEntities()
                        })
                    }
                    .disabled(mainState.selectedIds.count < 1).keyboardShortcut(.delete)
                    .help("Delete")

                // Edit
                Button(
                    action: {
                        reloadSelectedEntitiesDraft()
                        self.showEditView.toggle()
                    },
                    label: {
                        Image(systemName: "pencil.circle")
                            .foregroundColor(mainState.selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("e")
                    .disabled(mainState.selectedIds.count != 1)
                    .sheet(isPresented: $showEditView, content: { editView() })
                    .help("Edit")

                // Flag
                Button(
                    action: {
                        editEntities(op: "flag")
                    },
                    label: {
                        Image(systemName: "flag")
                            .foregroundColor(mainState.selectedIds.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("g")
                    .help("Toggle Flag")

                // Tag
                Button(
                    action: {
                        reloadSelectedEntitiesDraft()
                        self.showTagEditView.toggle()
                    },
                    label: {
                        Image(systemName: "tag")
                            .foregroundColor(mainState.selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("t")
                    .help("Edit Tags")
                    .disabled(mainState.selectedIds.count != 1)
                    .sheet(isPresented: $showTagEditView, content: { tagEditView() })

                // Folder
                Button(
                    action: {
                        reloadSelectedEntitiesDraft()
                        self.showFolderEditView.toggle()
                    },
                    label: {
                        Image(systemName: "folder.badge.plus")
                            .foregroundColor(mainState.selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("f")
                    .help("Edit Folders")
                    .disabled(mainState.selectedIds.count != 1)
                    .sheet(isPresented: $showFolderEditView, content: { folderEditView() })

                // Note
                Button(
                    action: {
                        reloadSelectedEntitiesDraft()
                        self.showNoteEditView.toggle()
                    },
                    label: {
                        Image(systemName: "note.text.badge.plus")
                            .foregroundColor(mainState.selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                    }
                )
                    .keyboardShortcut("n")
                    .help("Edit Note")
                    .disabled(mainState.selectedIds.count != 1)
                    .sheet(isPresented: $showNoteEditView, content: { noteEditView() })
            }

            Picker("", selection: $mainViewSwitcher) {
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
                    mainViewSortSwitcher = "title"
                    reloadEntities()
                })
                Button("Year", action: {
                    mainViewSortSwitcher = "pubTime"
                    reloadEntities()
                })
                Button("Add Time", action: {
                    mainViewSortSwitcher = "addTime"
                    reloadEntities()
                })
            } label: {
                Label("sort", systemImage: "list.bullet.indent")
            }
                .help("Sort by")
        }
    }
}

// MARK: - Side Effects

private extension MainView {
    func onDropFiletoMain(providers: [NSItemProvider]) {
        let urlGroup = DispatchGroup()

        var urlList: [URL] = .init()
        providers.forEach { provider in
            urlGroup.enter()
            provider.loadDataRepresentation(forTypeIdentifier: "public.file-url", completionHandler: { data, _ in
                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                    urlList.append(url)
                    urlGroup.leave()
                }
            })
        }

        urlGroup.notify(queue: .main) {
            if urlList.count > 0 {
                injected.interactors.entitiesInteractor.add(from: urlList)
            }
        }
    }

    func onDropFiletoDetail(providers: [NSItemProvider]) {
        let urlGroup = DispatchGroup()

        var urlList: [URL] = .init()
        providers.forEach { provider in
            urlGroup.enter()
            provider.loadDataRepresentation(forTypeIdentifier: "public.file-url", completionHandler: { data, _ in
                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                    urlList.append(url)
                    urlGroup.leave()
                }
            })
        }

        urlGroup.notify(queue: .main) {
            if urlList.count > 0 {
                urlList.forEach { supURL in
                    selectedEntitiesDraft.first?.supURLs.append(supURL.absoluteString)
                }
                editEntities()
            }
        }
    }

    func deleteEntities() {
        let ids = mainState.selectedIds
        clearSelected()
        injected.interactors.entitiesInteractor.delete(ids: ids)
    }

    func reloadEntities() {
        let (search, flag, tags, folders) = makeFilter()
        injected.interactors.entitiesInteractor.load(entities: $entities, search: search, flag: flag, tags: tags, folders: folders, sort: mainViewSortSwitcher)
        reloadSelectedEntities()
    }

    func clearSelected() {
        $selectedEntities.wrappedValue = .notRequested
        mainState.selectedIds.removeAll()
    }

    func reloadSelectedEntities() {
        mainState.$selectedIds
            .sink(receiveCompletion: {_ in}, receiveValue: { selectedIds in
                $selectedEntities.wrappedValue.setIsLoading(cancelBag: CancelBag())
                $selectedEntitiesDraft_.wrappedValue.setIsLoading(cancelBag: CancelBag())
                if $entities.wrappedValue.value != nil {
                    $entities.wrappedValue.value!.filter("id IN %@", selectedIds).collectionPublisher.eraseToAnyPublisher()
                        .sink(receiveCompletion: {_ in}, receiveValue: { filteredEntities in
                            $selectedEntities.wrappedValue = .loaded(filteredEntities)
                            $selectedEntitiesDraft.wrappedValue = filteredEntities.map({entity in return PaperEntityDraft(from: entity)})
                            $selectedEntitiesDraft_.wrappedValue = .loaded(filteredEntities.map({entity in return PaperEntityDraft(from: entity)}))
                        })
                        .store(in: cancelbag)
                } else {
                    $selectedEntities.wrappedValue = .notRequested
                }
            })
            .store(in: cancelbag)
    }

    func reloadSelectedEntitiesDraft() {
        $selectedEntitiesDraft.wrappedValue = selectedEntities.value!.map({entity in return PaperEntityDraft(from: entity)})
    }

    func editEntities(op: String = "update") {
        if op == "flag" {
            let updateRequestDrafts = $selectedEntitiesDraft.wrappedValue.map({entity -> PaperEntityDraft in
                entity.flag.toggle()
                return entity
            })
            injected.interactors.entitiesInteractor.update(entities: updateRequestDrafts)
        } else {
            // Currently only support edit one entity per time.
            let updateRequestDrafts = [$selectedEntitiesDraft.wrappedValue.first!]
            injected.interactors.entitiesInteractor.update(entities: updateRequestDrafts)
        }
    }

    func scrapeEntities() {
        injected.interactors.entitiesInteractor.scrape(entities: $selectedEntitiesDraft.wrappedValue)
    }

    func makeFilter() -> (String, Bool, [String], [String]) {
        let search = mainState.searchText

        if selectedFilters.contains("lib-all"), selectedFilters.count > 1 {
            selectedFilters = Set(["lib-all"])
        }

        let flag: Bool = selectedFilters.contains("lib-flag")
        var tags: [String] = .init()
        var folders: [String] = .init()

        selectedFilters.forEach { filter in
            if filter.starts(with: "tag-") {
                tags.append(filter)
            }
            if filter.starts(with: "folder-") {
                folders.append(filter)
            }
        }

        return (search, flag, tags, folders)
    }

    func openEntities() {
        if let selectedEntities = selectedEntities.value {
            selectedEntities.forEach { entity in
                if let url = getJoinedURL(entity.mainURL) {
                    NSWorkspace.shared.open(url)
                }
            }
        }
    }

    func exportEntities(format: ExportFormat = .bibtex) {
        if let selectedEntities = selectedEntities.value {
            injected.interactors.entitiesInteractor.export(entities: Array(selectedEntities), format: format)
        }
    }

    var appLibMovedUpdate: AnyPublisher<Date, Never> {
        injected.appState.updates(for: \.receiveSignals.appLibMoved)
    }

}
