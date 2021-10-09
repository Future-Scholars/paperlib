//
//  TableView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 12/07/2021.
//

import SwiftUI
import RealmSwift


struct ListView: View {
    private let db: PLDatabase = PLDatabase()
    
    @ObservedResults(PaperEntity.self) var entities
    @Binding var selectedIDs: Set<ObjectId>
    @Binding var selectedSidebars: Set<String>
    
    @State private var searchText = ""
    
    @State private var isShowEditView = false
    @State private var editEntity: PaperEntity?
    @State private var editTitle: String = ""
    @State private var editAuthors: String = ""
    @State private var editPublication: String = ""
    @State private var editPubtime: String = ""
    @State private var editPubtype: String = ""
    @State private var editDOI: String = ""
    @State private var editArxiv: String = ""
    @State private var editTags: String = ""
    @State private var editFolders: String = ""
    
    @State private var isShowTagEditView = false
    @State private var newTagText: String = ""
    @State private var selectNewTagText: String? = ""
    
    @State private var isShowFolderEditView = false
    @State private var newFolderText: String = ""
    @State private var selectNewFolderText: String? = ""
    
    @ObservedResults(PaperTag.self) var allTags
    @ObservedResults(PaperFolder.self) var allFolders
    
    var body: some View {
        HStack(spacing: 0){
            List(self.listSource(), selection: $selectedIDs){ entity in
                ListRow(entity: entity).frame(height: 55)
                    .contextMenu {
                        Button(action: {
                            if(selectedIDs.count > 1){
                                
                            }
                            else{
                                let url = URL(string: entity.mainURL ?? "")
                                if (url != nil) {
                                    NSWorkspace.shared.open(url!)
                                }
                            }
                        }) {
                            Text("Open")
                        }.keyboardShortcut(.defaultAction)
                        
                        Button(action: {
                            selectedIDs.forEach { id in
                                DispatchQueue.global().async {
                                    dataflow(url: nil, e: nil, id: id)
                                }
                            }
                        }) {
                            Text("Match")
                        }.keyboardShortcut("m")
                        
                        Button(action: {
                            if(selectedIDs.count > 1){
                                db.deleteEntitybyIDs(ids: selectedIDs)
                                selectedIDs.removeAll()
                            }
                            else{
                                db.deleteEntitybyIDs(ids: [entity.id])
                                if let indexToRemove = selectedIDs.firstIndex(of: entity.id) {
                                    selectedIDs.remove(at: indexToRemove)
                                }
                            }
                        }) {
                            Text("Delete")
                        }.keyboardShortcut(.delete)
                        
                        Button(action: {
                            if(selectedIDs.count > 1){
                                db.flagEntitybyIDs(ids: selectedIDs)
                            }
                            else{
                                db.flagEntitybyIDs(ids: [entity.id])
                            }
                        }) {
                            Text("Toggle Flag")
                        }.keyboardShortcut("t")
                        
                        Button(action: {
                            if (selectedIDs.count > 0) {
                                exportTexbyIDs(ids: selectedIDs)
                            }
                            else{
                                exportTexbyEntities(entities: self.listSource())
                            }
                        }) {
                            Text("Export Cibtex")
                        }.keyboardShortcut("c")
                    }
            }
            if let firstSelection = selectedIDs.first {
                Divider()
                DetailsView(id: firstSelection, db: self.db).frame(width: 300).background(Color(NSColor.controlBackgroundColor))
                    .onDrop(of: ["public.file-url"], isTargeted: nil) {providers -> Bool in
                        providers.forEach { provider in
                            provider.loadDataRepresentation(forTypeIdentifier: "public.file-url", completionHandler: { (data, error) in
                                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                                    PLDatabase().addSupsbyIDs(ids: [firstSelection], sups: [url.absoluteString])
                                }
                            })
                        }
                        
                        return true
                    }
            }
        }
        .toolbar {
            SearchBar(text: $searchText)
            
            Spacer()
            
            Button(action: {
                if (selectedIDs.count >= 1){
                    let entity = db.selectEntity(id: selectedIDs.first!)
                    let url = URL(string: entity!.mainURL ?? "")
                    if (url != nil) {
                        NSWorkspace.shared.open(url!)
                    }
                }
            }) {
                Image(systemName: "doc.text")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.keyboardShortcut(.defaultAction)
            
            Button(action: {
                db.deleteEntitybyIDs(ids: selectedIDs)
                selectedIDs.removeAll()
            }) {
                Image(systemName: "trash")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.disabled(selectedIDs.count < 1).keyboardShortcut(.delete)
            
            Button(action: {
                selectedIDs.forEach { id in
                    DispatchQueue.global().async {
                        dataflow(url: nil, e: nil, id: id)
                    }
                }
            }) {
                Image(systemName: "doc.text.magnifyingglass")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.disabled(selectedIDs.count < 1).keyboardShortcut("m")
            
            Button(action: {
                if(selectedIDs.count >= 1){
                    db.flagEntitybyIDs(ids: selectedIDs)
                }
            }) {
                Image(systemName: "flag")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.keyboardShortcut("t")
            
            Button(action: {
                self.isShowEditView = true
            }) {
                Image(systemName: "pencil.circle")
                    .foregroundColor(selectedIDs.count != 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.disabled(selectedIDs.count != 1)
                .sheet(isPresented: $isShowEditView, content: {
                    VStack(alignment: .leading) {
                        TextfieldView(title: "Title", text: $editTitle, showTitle: true).padding(.bottom, 10)
                        TextfieldView(title: "Author", text: $editAuthors, showTitle: true).padding(.bottom, 10)
                        TextfieldView(title: "Publication", text: $editPublication, showTitle: true).padding(.bottom, 10)
                        HStack {
                            TextfieldView(title: "PubTime", text: $editPubtime, showTitle: true).padding(.bottom, 10)
                            Picker("", selection: $editPubtype) {
                                ForEach(["Conference", "Journal", "Others"], id: \.self) {
                                    Text($0)
                                }
                            }.pickerStyle(SegmentedPickerStyle()).padding(.bottom, 10)
                        }
                        HStack {
                            TextfieldView(title: "DOI", text: $editDOI, showTitle: true).padding(.bottom, 10)
                            TextfieldView(title: "ArxivID", text: $editArxiv, showTitle: true).padding(.bottom, 10).padding(.leading, 8)
                        }
                        TextfieldView(title: "Tags", text: $editTags, showTitle: true).padding(.bottom, 10)
                        TextfieldView(title: "Folders", text: $editFolders, showTitle: true).padding(.bottom, 10)
                        Spacer()
                        HStack {
                            Button(action: {
                                self.isShowEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("Close")
                            }
                            Spacer()
                            Button(action: {
                                editEntity = db.selectEntity(id: selectedIDs.first!)
                                let realm = try! Realm()
                                
                                try! realm.write {
                                    editEntity!.title = editTitle
                                    editEntity!.authors = editAuthors
                                    editEntity!.publication = editPublication
                                    editEntity!.pubTime = editPubtime
                                    editEntity!.pubType = idxPubType[editPubtype]
                                    editEntity!.doi = editDOI.isEmpty ? nil : editDOI
                                    editEntity!.arxiv = editArxiv.isEmpty ? nil : editArxiv
                                }
                                
                                db.deleteTagsbyIDs(ids: [editEntity!.id])
                                db.addTagsbyIDs(ids: [editEntity!.id], tags: editTags)
                                
                                db.deleteFoldersbyIDs(ids: [editEntity!.id])
                                db.addFoldersbyIDs(ids: [editEntity!.id], folders: editFolders)
                                
                                self.isShowEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("OK")
                            }
                        }
                    }.frame(width: 450, alignment: .leading).padding()
                        .onAppear(perform: {
                            editEntity = db.selectEntity(id: selectedIDs.first!)
                            editTitle = editEntity!.title
                            editAuthors = editEntity!.authors
                            editPublication = editEntity!.publication
                            editPubtime = editEntity!.pubTime
                            editPubtype = pubTypeIdx[editEntity!.pubType ?? 0] ?? "Journal"
                            editDOI = editEntity!.doi ?? ""
                            editArxiv = editEntity!.arxiv ?? ""
                            
                            var editTagList = Array<String>()
                            editEntity!.tags.forEach { tag in
                                editTagList.append(tag.name)
                            }
                            editTags = editTagList.joined(separator: "; ")
                            
                            var editFolderList = Array<String>()
                            editEntity!.folders.forEach { folder in
                                editFolderList.append(folder.name)
                            }
                            editFolders = editFolderList.joined(separator: "; ")
                            
                        })
                })
            
            Button(action: {
                self.isShowTagEditView = true
            }) {
                Image(systemName: "tag")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.disabled(selectedIDs.count < 1)
                .sheet(isPresented: $isShowTagEditView, content: {
                    VStack(alignment: .leading) {
                        TextfieldView(title: "Add Tag", text: $newTagText, showTitle: false)
                        
                        List(self.allTags, selection: $selectNewTagText){ tag in
                            Text(tag.name)
                        }.frame(height: 300).onChange(of: selectNewTagText, perform: {selectNewTagText in
                            let newTagTextList = newTagText.split(separator: ";")
                            var newTagTextTrimedList = newTagTextList.map{$0.trimmingCharacters(in: .whitespaces)}
                            if (!newTagTextTrimedList.contains(selectNewTagText!)) {
                                newTagTextTrimedList.append(selectNewTagText!.replacingOccurrences(of: "tag-", with: ""))
                            }
                            newTagText = newTagTextTrimedList.joined(separator: "; ")
                        })
                        
                        Spacer()
                        
                        HStack {
                            Button(action: {
                                self.isShowTagEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("Close")
                            }
                            Spacer()
                            Button(action: {
                                db.addTagsbyIDs(ids: selectedIDs, tags: newTagText)
                                self.isShowTagEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("OK")
                            }
                        }
                    }.padding().frame(maxHeight: 400).frame(minWidth: 350, minHeight: 200).onAppear(perform: {
                        newTagText = ""
                        selectNewTagText?.removeAll()
                    })
                })
            
            Button(action: {
                self.isShowFolderEditView = true
            }) {
                Image(systemName: "folder.badge.plus")
                    .foregroundColor(selectedIDs.count < 1 ? Color.primary.opacity(0.2) : Color.primary.opacity(0.5))
            }.disabled(selectedIDs.count < 1)
                .sheet(isPresented: $isShowFolderEditView, content: {
                    VStack(alignment: .leading) {
                        TextfieldView(title: "Add Folder", text: $newFolderText, showTitle: false)
                        
                        List(self.allFolders, selection: $selectNewFolderText){ folder in
                            Text(folder.name)
                        }.frame(height: 300).onChange(of: selectNewFolderText, perform: {selectNewFolderText in
                            let newFolderTextList = newFolderText.split(separator: ";")
                            var newFolderTextTrimedList = newFolderTextList.map{$0.trimmingCharacters(in: .whitespaces)}
                            if (!newFolderTextTrimedList.contains(selectNewFolderText!)) {
                                newFolderTextTrimedList.append(selectNewFolderText!.replacingOccurrences(of: "folder-", with: ""))
                            }
                            newFolderText = newFolderTextTrimedList.joined(separator: "; ")
                        })
                        
                        Spacer()
                        
                        HStack {
                            Button(action: {
                                self.isShowFolderEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("Close")
                            }
                            Spacer()
                            Button(action: {
                                db.addFoldersbyIDs(ids: selectedIDs, folders: newFolderText)
                                self.isShowFolderEditView = false
                                NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                            }) {
                                Text("OK")
                            }
                        }
                    }.padding().frame(maxHeight: 400).frame(minWidth: 350, minHeight: 200).onAppear(perform: {
                        newFolderText = ""
                        selectNewFolderText?.removeAll()
                    })
                })
            
            Button(action: {
                if (selectedIDs.count > 0) {
                    exportTexbyIDs(ids: selectedIDs)
                }
                else{
                    exportTexbyEntities(entities: self.listSource())
                }
            }) {
                Image(systemName: "square.and.arrow.up")
                    .foregroundColor(Color.primary.opacity(0.5))
            }.keyboardShortcut("c")
            
        }.onDrop(of: ["public.file-url"], isTargeted: nil) {providers -> Bool in
            providers.forEach { provider in
                provider.loadDataRepresentation(forTypeIdentifier: "public.file-url", completionHandler: { (data, error) in
                    if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                        DispatchQueue.global().async {
                            dataflow(url: url, e: nil, id: nil)
                        }
                    }
                })
            }
            
            return true
        }
    }
    
    func listSource() -> Results<PaperEntity> {
        if ((selectedSidebars.contains("lib-all") || selectedSidebars.count == 0) && self.searchText.isEmpty){
            return self.entities.sorted(byKeyPath: "addTime", ascending: false)
        }
        else {
            var filterFormat = ""
            if (!self.searchText.isEmpty) {
                filterFormat += "(title contains[cd] '\(self.searchText.trimmingCharacters(in: CharacterSet.newlines))' OR authors contains[cd] '\(self.searchText.trimmingCharacters(in: CharacterSet.newlines))' OR publication contains[cd] '\(self.searchText.trimmingCharacters(in: CharacterSet.newlines))') AND "
            }
            
            self.selectedSidebars.forEach { ss in
                if (ss == "lib-flag") {
                    filterFormat += "(flag == true) AND "
                }
                if (ss.starts(with: "tag-")) {
                    filterFormat += "(ANY tags.id == '\(ss)') AND "
                }
                if (ss.starts(with: "folder-")) {
                    filterFormat += "(ANY folders.id == '\(ss)') AND "
                }
                
            }
            filterFormat = String(filterFormat[..<String.Index(utf16Offset: (filterFormat.count - 4), in: filterFormat)])
            return self.entities.filter(filterFormat).sorted(byKeyPath: "addTime", ascending: false)
        }
    }
}

struct ListRow: View {
    var entity: PaperEntity
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entity.title).bold().lineLimit(1)
            Text(entity.authors).lineLimit(1).font(.subheadline)
            HStack{
                Text(entity.pubTime).lineLimit(1)
                Text("|")
                Text(entity.publication).italic().lineLimit(1)
                if (entity.flag){
                    Text("|")
                    Image(systemName: "flag.fill")
                }
            }.foregroundColor(Color.secondary).font(.subheadline)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}


