//
//  SwiftUIView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 10/07/2021.
//

import SwiftUI
import RealmSwift


struct SiderbarSectionTitle: View {
    let text: String
    
    var body: some View {
        Text(text).bold()
            .font(.subheadline)
            .foregroundColor(Color.secondary.opacity(0.8))
    }
}

struct SidebarView: View {
    @ObservedResults(PaperTag.self) var allTags
    @ObservedResults(PaperFolder.self) var allFolders
    @Binding var selectedIDs: Set<ObjectId>
    @Binding var selectedSidebars: Set<String>

    @State private var isTagExpanded: Bool = true
    @State private var isFolderExpanded: Bool = true
    
    var body: some View {
        List(selection: $selectedSidebars) {
            
            SiderbarSectionTitle(text: "Library")
            Label("All Papers", systemImage: "book").tag("lib-all")
            Label("Flags", systemImage: "flag").tag("lib-flag")
            
            DisclosureGroup(isExpanded: $isTagExpanded, content: {
                ForEach(allTags) {tag in
                    Label(tag.name, systemImage: "tag")
                }
            }, label: { SiderbarSectionTitle(text: "Tags")})
            
            DisclosureGroup(isExpanded: $isFolderExpanded, content: {
                ForEach(allFolders) {folder in
                    Label(folder.name, systemImage: "folder")
                }
            }, label: { SiderbarSectionTitle(text: "Folders")})
            
        }.onChange(of: selectedSidebars, perform: {selection in
            selectedIDs.removeAll()
            if selection.contains("lib-all") {
                self.selectedSidebars = self.selectedSidebars.filter { s in
                    return s == "lib-all"
                }
            }
        })
    }
}



