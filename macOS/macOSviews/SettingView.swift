//
//  SettingView.swift
//  PaperLib (macOS)
//
//  Created by GeoffreyChen on 23/09/2021.
//

import SwiftUI
import SwiftUILib_DocumentPicker

struct SettingsView: View {
    private enum Tabs: Hashable {
        case general
    }
    var body: some View {
        TabView {
            GeneralSettingsView()
                .tabItem {
                    Label("General", systemImage: "gear")
                }
                .tag(Tabs.general)
        }
        .padding()
        .frame(width: 375, height: 150)
    }
}


struct GeneralSettingsView: View {
    @AppStorage("appLibFolder") private var appLibFolder = ""
    @State var showPicker = false

    var body: some View {
        VStack (alignment: .leading) {
            Text("Select Library Folder:")
            
            Text("(Please restart PaperLib enable modified settings.)").bold()
            HStack {
                Text(appLibFolder)
                Button("Select") {
                      self.showPicker.toggle()
                    }
                    .documentPicker(
                      isPresented: $showPicker,
                      documentTypes: ["public.folder"], onDocumentsPicked:  { urls in
                          appLibFolder = urls.first!.absoluteString
                      })
            }
        }

    }
}
