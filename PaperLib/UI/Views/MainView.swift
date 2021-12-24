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
    // Common
    @State private var selectedIds: Set<ObjectId> = .init()
    @State private var selectedEntities: Loadable<Results<PaperEntity>>
    @State private var selectedEntitiesDraft: [PaperEntityDraft] = .init()

    // Sidebar
    @State private var selectedFilters: Set<String> = .init()
    @State private var statusText: String = ""
    
    // Main List
    @StateObject private var searchText = SearchBarViewModel()

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
    }

    var body: some View {
        NavigationView {
            // MARK: - Sidebar

            SidebarView(selectedFilters: $selectedFilters, statusText: $statusText)
                .inject(injected)
                .frame(minWidth: 300)
                .toolbar {
                    ToolbarItem(placement: ToolbarItemPlacement.status) {
                        Button(action: {
                            NSApp.keyWindow?.firstResponder?.tryToPerform(#selector(NSSplitViewController.toggleSidebar(_:)), with: nil)
                        }) {
                            Label("Toggle Sidebar", systemImage: "sidebar.left")
                        }
                    }
                }
                .onChange(of: selectedFilters, perform: { _ in
                    clearSelected()
                    reloadEntities()
                })

            // MARK: - Main list

            HStack(spacing: 0) {
                MainContent()
                DetailContent()
                    .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                        onDropFiletoDetail(providers: providers)
                        return true
                    }
            }
            .toolbar {
                SearchBar(text: $searchText.text)
                    .onReceive(
                        searchText.$text
                            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
                    ) {
                        clearSelected()
                        reloadEntities()
                        guard !$0.isEmpty else { return }
                    }
                Spacer()
                menuButtons()
            }
            .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                
                DispatchQueue.global(qos: .background).async {
                    onDropFiletoMain(providers: providers)
                }
                
                return true
            }
            .onAppear(perform: reloadEntities)
            .onChange(of: selectedIds, perform: { _ in
                reloadSelectedEntities()
                if selectedIds.count > 0 {
                    self.statusText = "\(selectedIds.count) / \(entities.value!.count)"
                }
                else {
                    statusText = ""
                }
            })
            .onReceive(appLibMovedUpdate, perform: { _ in
                if injected.appState[\.setting.settingOpened], injected.appState[\.receiveSignals.mainView] > 0 {
                    injected.appState[\.receiveSignals.mainView] -= 1
                    reloadEntities()
                    clearSelected()
                }
            })
        }
    }

    private func MainContent() -> AnyView {
        switch entities {
        case .notRequested: return AnyView(notRequestedView().onAppear(perform: reloadEntities))
        case let .isLoading(last, _): return AnyView(loadingView(last))
        case let .loaded(entities): return AnyView(loadedView(entities))
        case let .failed(error): return AnyView(failedView(error))
        }
    }

    private func DetailContent() -> AnyView {
        switch selectedEntities {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(detailLoadingView(last))
        case let .loaded(detailEntities): return AnyView(detailLoadedView(detailEntities))
        case let .failed(error): return AnyView(failedView(error))
        }
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
        print("loading")
        if let entities = previouslyLoaded {
            return AnyView(
                ZStack{
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
                List(selection: $selectedIds) {
                    ForEach(entities) { entity in
                        ListRow(entity: entity).frame(height: 55)
                            .contextMenu {
                                rowContextMenu()
                            }
                    }
                }
            )
        } else {
            return AnyView(
                Table(entities, selection: $selectedIds) {
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
            Button(action: {
                openEntities()
            }) {
                Text("Open")
            }.keyboardShortcut(.defaultAction)

            Button(action: {
                reloadSelectedEntitiesDraft()
                self.showEditView.toggle()
            }) {
                Text("Edit")
            }.keyboardShortcut("e")
            .disabled(selectedIds.count != 1)
            
            Button(action: {
                matchEntities()
            }) {
                Text("Match")
            }.keyboardShortcut("r")

            Button(action: {
                deleteEntities()
            }) {
                Text("Delete")
            }.keyboardShortcut(.delete)

            Divider()

            Button(action: {
                editEntities(op: "flag")
            }) {
                Text("Toggle Flag")
            }.keyboardShortcut("g")

            Button(action: {
                reloadSelectedEntitiesDraft()
                self.showTagEditView.toggle()
            }) {
                Text("Add Tag")
            }
            .keyboardShortcut("t")
            .disabled(selectedIds.count != 1)
            .sheet(isPresented: $showTagEditView, content: { tagEditView() })

            Button(action: {
                reloadSelectedEntitiesDraft()
                self.showFolderEditView.toggle()
            }) {
                Text("Add Folder")
            }
            .keyboardShortcut("g")
            .disabled(selectedIds.count != 1)
            .sheet(isPresented: $showFolderEditView, content: { folderEditView() })

            Divider()

            Menu("Export") {
                Button(action: {
                    exportEntities(format: "bibtex")
                }) {
                    Text("Bibtex")
                }
                Button(action: {
                    exportEntities(format: "plain")
                }) {
                    Text("Plain Text")
                }
            }
        }
    }
    
    // Detail View
    func detailLoadingView(_ previouslyLoaded: Results<PaperEntity>?) -> some View {
        if let entities = previouslyLoaded {
            return AnyView(detailLoadedView(entities))
        } else {
            return AnyView(EmptyView())
        }
    }

    func detailLoadedView(_ entities: Results<PaperEntity>) -> some View {
        if entities.count == 1 {
            return AnyView(DetailView(entity: entities.first!).inject(injected))
        } else {
            return AnyView(EmptyView())
        }
    }
    
    // Edit View

    func editView() -> some View {
        return VStack {
            EditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button(action: {
                    showEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Close")
                }
                Spacer()
                Button(action: {
                    editEntities()
                    showEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Save & Close")
                }
            }.padding()
        }
    }

    // Tag Edit View
    func tagEditView() -> some View {
        return VStack {
            TagEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button(action: {
                    showTagEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Close")
                }
                Spacer()
                Button(action: {
                    editEntities()
                    showTagEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Save & Close")
                }
            }.padding()
        }
    }

    // Folder Edit View
    func folderEditView() -> some View {
        return VStack {
            FolderEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button(action: {
                    showFolderEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Close")
                }
                Spacer()
                Button(action: {
                    editEntities()
                    showFolderEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Save & Close")
                }
            }.padding()
        }
    }

    func noteEditView() -> some View {
        return VStack {
            NoteEditView($selectedEntitiesDraft)
            Spacer()
            HStack {
                Button(action: {
                    showNoteEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Close")
                }
                Spacer()
                Button(action: {
                    editEntities()
                    showNoteEditView.toggle()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                }) {
                    Text("Save & Close")
                }
            }.padding()
        }
    }
    
    // Menu Buttons
    func menuButtons() -> some View {
        HStack {
                       
            HStack {
                // Open
                Button(action: {
                    openEntities()
                }) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .foregroundColor(selectedIds.count == 0 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }
                .keyboardShortcut(.defaultAction)
                .disabled(selectedIds.count == 0)
                .hidden()

                // Export
                Button(action: {
                    exportEntities(format: "bibtex")
                }) {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(Color.primary.opacity(0.5))
                }.keyboardShortcut("c")
                    .disabled(selectedIds.count == 0)
                    .hidden()

                // Match
                Button(action: {
                    matchEntities()
                }) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .foregroundColor(selectedIds.count == 0 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("r")
                .help("Match Metadata")
                .disabled(selectedIds.count == 0)

                // Delete
                Button(action: {
                    showConfirmationDelete.toggle()
                }) {
                    Image(systemName: "trash")
                        .foregroundColor(selectedIds.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }
                .confirmationDialog("Are you sure to delete?", isPresented: $showConfirmationDelete) {
                    Button(action: {
                        showConfirmationDelete.toggle()
                        deleteEntities()
                    }) {
                        Text("Yes")
                    }
                }
                .disabled(selectedIds.count < 1).keyboardShortcut(.delete)
                .help("Delete")

                // Edit
                Button(action: {
                    reloadSelectedEntitiesDraft()
                    self.showEditView.toggle()
                }) {
                    Image(systemName: "pencil.circle")
                        .foregroundColor(selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("e")
                .disabled(selectedIds.count != 1)
                .sheet(isPresented: $showEditView, content: { editView() })
                .help("Edit")

                // Flag
                Button(action: {
                    editEntities(op: "flag")
                }) {
                    Image(systemName: "flag")
                        .foregroundColor(selectedIds.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("g")
                    .help("Toggle Flag")

                // Tag
                Button(action: {
                    reloadSelectedEntitiesDraft()
                    self.showTagEditView.toggle()
                }) {
                    Image(systemName: "tag")
                        .foregroundColor(selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("t")
                .help("Edit Tags")
                .disabled(selectedIds.count != 1)
                .sheet(isPresented: $showTagEditView, content: { tagEditView() })

                // Folder
                Button(action: {
                    reloadSelectedEntitiesDraft()
                    self.showFolderEditView.toggle()
                }) {
                    Image(systemName: "folder.badge.plus")
                        .foregroundColor(selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("f")
                .help("Edit Folders")
                .disabled(selectedIds.count != 1)
                .sheet(isPresented: $showFolderEditView, content: { folderEditView() })

                // Note
                Button(action: {
                    reloadSelectedEntitiesDraft()
                    self.showNoteEditView.toggle()
                }) {
                    Image(systemName: "note.text.badge.plus")
                        .foregroundColor(selectedIds.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.7))
                }.keyboardShortcut("n")
                .help("Edit Note")
                .disabled(selectedIds.count != 1)
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
                urlList.forEach { supUrl in
//                    editedSelectedEntity.supURLs.append(supUrl.path)
                }
                editEntities()
            }
        }
    }

    func deleteEntities() {
        injected.interactors.entitiesInteractor.delete(ids: selectedIds)
        clearSelected()
    }

    func reloadEntities() {
        let (flag, tags, folders) = makeFilter()
        
        injected.interactors.entitiesInteractor.load(entities: $entities, search: searchText.text, flag: flag, tags: tags, folders: folders, sort: mainViewSortSwitcher)
        
    }

    func clearSelected() {
        selectedIds.removeAll()
    }

    func reloadSelectedEntities() {
        injected.interactors.entitiesInteractor.load(entities: $selectedEntities, drafts: $selectedEntitiesDraft, ids: selectedIds)
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

    func matchEntities() {
        injected.interactors.entitiesInteractor.match(entities: $selectedEntitiesDraft.wrappedValue)
    }

    func makeFilter() -> (Bool, [String], [String]) {
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

        return (flag, tags, folders)
    }

    func openEntities() {
        if let selectedEntities = selectedEntities.value {
            selectedEntities.forEach { entity in
                if let url = injected.interactors.entitiesInteractor.getJoinedUrl(entity.mainURL) {
                    NSWorkspace.shared.open(url)
                }
            }
        }
    }

    func exportEntities(format: String = "bibtex") {
        if let selectedEntities = selectedEntities.value {
            injected.interactors.entitiesInteractor.export(entities: Array(selectedEntities), format: format)
        }
    }

    var appLibMovedUpdate: AnyPublisher<Date, Never> {
        injected.appState.updates(for: \.receiveSignals.appLibMoved)
    }
}
