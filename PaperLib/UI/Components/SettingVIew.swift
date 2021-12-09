//
//  SettingView.swift
//  PaperLib (macOS)
//
//  Created by GeoffreyChen on 23/09/2021.
//

import SwiftUI

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
        .frame(width: 550, height: 150)
    }
}


struct GeneralSettingsView: View {
    @AppStorage("appLibFolder") private var appLibFolder = ""
    @State var showPicker = false
    
    var body: some View {
        
        VStack (alignment: .leading) {
            HStack (alignment: .top) {
                Text("Choose a folder to store paper files (e.g., PDF etc.). Changing this setting requires a restarting of PaperLib to take effect.").frame(width: 250).multilineTextAlignment(.trailing).font(.caption)
                Text(
                    (appLibFolder.count > 7) ? String(appLibFolder[String.Index(utf16Offset: 7, in: appLibFolder)...]) : "Choose a folder"
                )
                    .font(.caption)
                    .frame(width: 250)
                    .multilineTextAlignment(.leading)
                    .padding(3)
                    .overlay(
                        RoundedRectangle(cornerRadius: 3).stroke(Color.secondary, lineWidth: 1)
                    ).onTapGesture {
                        self.selectFolder()
                    }
            }
        }

    }
    
    func selectFolder() {
            
            let folderChooserPoint = CGPoint(x: 0, y: 0)
            let folderChooserSize = CGSize(width: 500, height: 600)
            let folderChooserRectangle = CGRect(origin: folderChooserPoint, size: folderChooserSize)
            let folderPicker = NSOpenPanel(contentRect: folderChooserRectangle, styleMask: .utilityWindow, backing: .buffered, defer: true)

            folderPicker.canChooseDirectories = true
            folderPicker.canChooseFiles = false
            folderPicker.allowsMultipleSelection = false

            folderPicker.begin { response in
                
                if response == .OK {
                    let pickedFolders = folderPicker.urls
                    appLibFolder = pickedFolders[0].absoluteString
                }
            }
        }
}
