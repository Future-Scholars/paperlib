//
//  ContentView.swift
//  Shared
//
//  Created by GeoffreyChen on 10/07/2021.
//

import SwiftUI
import RealmSwift

struct ContentView: View {
    @State var selectedSidebars = Set<String>()
    @State var selectedIDs = Set<ObjectId>()
    
    var body: some View {
        NavigationView {
            SidebarView(selectedIDs: $selectedIDs, selectedSidebars: $selectedSidebars)
                .frame(minWidth: 300)
                .toolbar {
                    ToolbarItem(placement: ToolbarItemPlacement.status) {
                        Button(action: toggleSidebar) {
                            Label("Toggle Sidebar", systemImage: "sidebar.left")
                        }
                    }
                }
            ListView(selectedIDs: $selectedIDs, selectedSidebars: $selectedSidebars)
        }
        .frame(minWidth: 1300, minHeight: 800)
    }
}

private func toggleSidebar() {
    NSApp.keyWindow?.firstResponder?.tryToPerform(#selector(NSSplitViewController.toggleSidebar(_:)), with: nil)
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
