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
    @Environment(\.injected) private var injected: DIContainer
    
    @AppStorage("appLibFolder") private var appLibFolder = ""
    @AppStorage("invertColor") private var invertColor = true
    @AppStorage("preferColorTheme") private var preferColorTheme = "System Default"
    
    @State var showPicker = false
    
    
    var body: some View {
        
        VStack (alignment: .leading) {
            HStack (alignment: .top) {
                Text("Choose a folder to store paper files (e.g., PDF etc.) and the database files.").frame(width: 250).multilineTextAlignment(.trailing).font(.caption)
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
                        onSelectFolder()
                    }
            }
            .padding(.bottom, 15)
            
            HStack (alignment: .top) {
                Text("Color Theme.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                Picker("", selection: $preferColorTheme) {
                    ForEach(["Light", "Dark", "System Default"], id: \.self) {
                        Text($0).font(.caption)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(width: 150)
            }
            .padding(.bottom, 15)
            .onChange(of: preferColorTheme, perform: { colorTheme in
                injected.appState[\.setting.colorScheme] = colorTheme
            })
            
            HStack (alignment: .top) {
                Text("Invert color of previews in the dark mode.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                Toggle("", isOn: $invertColor)
                    .toggleStyle(.checkbox)
            }
            .onChange(of: invertColor, perform: { invert in
                injected.appState[\.setting.invertColor] = invert
            })
        }
        .onAppear(perform: {
            injected.appState[\.setting.settingOpened] = true
        })
        .onDisappear(perform: {
            injected.appState[\.setting.settingOpened] = false
        })

    }
    
    func onSelectFolder() {
            
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
                    
                    injected.appState[\.receiveSignals.sideBarTag] += 1
                    injected.appState[\.receiveSignals.sideBarFolder] += 1
                    injected.appState[\.receiveSignals.mainViewEntities] += 1
                    injected.appState[\.receiveSignals.mainViewSelectedEntities] += 1
                    injected.appState[\.setting.appLibFolder] = pickedFolders[0].absoluteString
                    
                    injected.interactors.entitiesInteractor.moveLib()
                    
                }
            }
        }
}
