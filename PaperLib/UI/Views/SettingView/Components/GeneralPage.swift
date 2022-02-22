//
//  GeneralPage.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct GeneralPage: View {
    @Environment(\.injected) private var injected: DIContainer

    @AppStorage("appLibFolder") private var appLibFolder = ""
    @AppStorage("invertColor") private var invertColor = true
    @AppStorage("preferColorTheme") private var preferColorTheme = "System Default"
    @AppStorage("deleteSourceFile") private var deleteSourceFile = true
    @AppStorage("showSidebarCount") private var showSidebarCount = true

    @State var showPicker = false

    var body: some View {
        VStack(alignment: .leading) {
            HStack(alignment: .top) {
                Text("Choose a folder to store paper files (e.g., PDF etc.) and the local database files.").frame(width: 250).multilineTextAlignment(.trailing).font(.caption)
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

            HStack(alignment: .top) {
                Text("Color Theme.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
                Picker("", selection: $preferColorTheme) {
                    ForEach(["Light", "Dark", "System Default"], id: \.self) {
                        Text($0).font(.caption)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(width: 150)
            }
            .padding(.bottom, 15)
            .onChange(of: preferColorTheme, perform: { preferColorTheme in
                UserDefaults.standard.set(preferColorTheme, forKey: "preferColorTheme")
            })

            HStack(alignment: .top) {
                Text("Invert colors of previews in the dark mode.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
                Toggle("", isOn: $invertColor)
                    .toggleStyle(.checkbox)
            }
            .onChange(of: invertColor, perform: { invert in
                UserDefaults.standard.set(invert, forKey: "invertColor")
            })

            HStack(alignment: .top) {
                Text("Automatically delete the imported source file.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
                Toggle("", isOn: $deleteSourceFile)
                    .toggleStyle(.checkbox)
            }
            .onChange(of: deleteSourceFile, perform: { deleteSourceFile in
                UserDefaults.standard.set(deleteSourceFile, forKey: "deleteSourceFile")

            })

            HStack(alignment: .top) {
                Text("Show count number on sidebar.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
                Toggle("", isOn: $showSidebarCount)
                    .toggleStyle(.checkbox)
            }
            .onChange(of: showSidebarCount, perform: { showSidebarCount in
                UserDefaults.standard.set(showSidebarCount, forKey: "showSidebarCount")
            })
        }
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

                UserDefaults.standard.set(appLibFolder, forKey: "appLibFolder")
                injected.interactors.entitiesInteractor.openLib()
            }
        }
    }
}
