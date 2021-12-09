//
//  EditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 04/12/2021.
//

import SwiftUI
import RealmSwift


struct TextfieldView: View {
    let title: String
    @Binding var text: String
    let showTitle: Bool
    var placeHolder: String? = nil

    var body: some View {
            HStack {
                Spacer()
                if (showTitle) {
                    Text(title).foregroundColor(Color.primary).bold()
                }
                TextField(placeHolder ?? title, text: $text)
                    .textFieldStyle(PlainTextFieldStyle())
                    .foregroundColor(.primary)
                    .padding(8)
                Spacer()
            }
            .foregroundColor(.secondary)
            .background(Color(NSColor.windowBackgroundColor))
            .cornerRadius(10)
    }
}


struct EditView: View {
    @Binding var editEntity: EditPaperEntity
    
    init(_ editEntity: Binding<EditPaperEntity>) {
        self._editEntity = editEntity
    }
    
    
    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Title", text: $editEntity.title, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Author", text: $editEntity.authors, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Publication", text: $editEntity.publication, showTitle: true).padding(.bottom, 10)
            HStack {
                TextfieldView(title: "PubTime", text: $editEntity.pubTime, showTitle: true).padding(.bottom, 10)
                Picker("", selection: $editEntity.pubType) {
                    ForEach(["Journal", "Conference", "Others"], id: \.self) {
                        Text($0)
                    }
                }.pickerStyle(SegmentedPickerStyle()).padding(.bottom, 10)
            }
            HStack {
                TextfieldView(title: "DOI", text: $editEntity.doi, showTitle: true).padding(.bottom, 10)
                TextfieldView(title: "ArxivID", text: $editEntity.arxiv, showTitle: true).padding(.bottom, 10).padding(.leading, 8)
            }
            TextfieldView(title: "Tags", text: $editEntity.tags, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Folders", text: $editEntity.folders, showTitle: true).padding(.bottom, 10)
        }
        .frame(width: 450, alignment: .leading).padding()
        
    }
}


struct TagEditView: View {
    @Environment(\.injected) private var injected: DIContainer
    
    @Binding var editEntity: EditPaperEntity
    @State private var editString: String
    @State private var selectTag: String?
    
    @State private var tags: Loadable<Results<PaperTag>>
    
    init(_ editEntity: Binding<EditPaperEntity>) {
        _editString = State(initialValue: editEntity.tags.wrappedValue)
        self._editEntity = editEntity
        
        self._tags = .init(initialValue: Loadable<Results<PaperTag>>.notRequested)
    }
    
    
    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Tags", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                .onChange(of: editString, perform: { _ in
                    editEntity.tags = editString
                })
            TagContent()
            
        }
        .frame(width: 450, alignment: .leading).padding()
        .onAppear(perform: reloadTags)
        
    }
    
    private func TagContent() -> AnyView {
        switch tags {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(tagLoadingView(last))
        case let .loaded(tags): return AnyView(tagLoadedView(tags))
        case let .failed(_): return AnyView(EmptyView())
        }
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
            List(tags, selection: $selectTag){ tag in
                Text(tag.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectTag,
                perform: { selectTag in
                    var tagList = editEntity.tags.components(separatedBy: ";")
                    if (tagList.count == 1 && tagList.first!.isEmpty){
                        tagList.removeAll()
                    }
                    tagList = tagList.map{ formatString($0, trimWhite: true)! }
                    
                    let formatedSelectTag = formatString(selectTag, removeStr: "tag-", trimWhite: true)!
                    if (!tagList.contains(formatedSelectTag)) {
                        tagList.append(formatedSelectTag)
                    }
                    editEntity.tags = tagList.joined(separator: "; ")
                    editString = editEntity.tags
                })
        )
    }
}

private extension TagEditView {
    
    func reloadTags () {
        injected.interactors.entitiesInteractor.load(tags: $tags, cancelBagKey: "tags-edit")
    }
    
}


struct FolderEditView: View {
    @Environment(\.injected) private var injected: DIContainer
    
    @Binding var editEntity: EditPaperEntity
    @State private var editString: String
    @State private var selectFolder: String?
    
    @State private var folders: Loadable<Results<PaperFolder>>
    
    init(_ editEntity: Binding<EditPaperEntity>) {
        _editString = State(initialValue: editEntity.folders.wrappedValue)
        self._editEntity = editEntity
        
        self._folders = .init(initialValue: Loadable<Results<PaperFolder>>.notRequested)
    }
    
    
    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Folders", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                .onChange(of: editString, perform: { _ in
                    editEntity.folders = editString
                })
            
            FolderContent()
        }
        .frame(width: 450, alignment: .leading).padding()
        .onAppear(perform: reloadFolders)
        
    }
    
    private func FolderContent() -> AnyView {
        switch folders {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(folderLoadingView(last))
        case let .loaded(folders): return AnyView(folderLoadedView(folders))
        case let .failed(_): return AnyView(EmptyView())
        }
    }
    
    // Tag
    func folderLoadingView(_ previouslyLoaded: Results<PaperFolder>?) -> some View {
        if let folders = previouslyLoaded {
            return AnyView(folderLoadedView(folders))
        } else {
            return AnyView(EmptyView())
        }
    }
    
    func folderLoadedView(_ folders: Results<PaperFolder>) -> some View {
        return AnyView(
            List(folders, selection: $selectFolder){ folder in
                Text(folder.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectFolder,
                perform: { selectFolder in
                    var folderList = editEntity.folders.components(separatedBy: ";")
                    if (folderList.count == 1 && folderList.first!.isEmpty){
                        folderList.removeAll()
                    }
                    folderList = folderList.map{ formatString($0, trimWhite: true)! }
                    
                    let formatedSelectFolder = formatString(selectFolder, removeStr: "folder-", trimWhite: true)!
                    if (!folderList.contains(formatedSelectFolder)) {
                        folderList.append(formatedSelectFolder)
                    }
                    editEntity.folders = folderList.joined(separator: "; ")
                    editString = editEntity.folders
                })
        )
    }
}

private extension FolderEditView {
    
    func reloadFolders () {
        injected.interactors.entitiesInteractor.load(folders: $folders, cancelBagKey: "folders-edit")
    }
    
}
