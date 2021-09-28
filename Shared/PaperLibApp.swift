//
//  PaperLibApp.swift
//  Shared
//
//  Created by GeoffreyChen on 10/07/2021.
//

import SwiftUI

@main
struct PaperLibApp: App {
    
    var body: some Scene {
        WindowGroup {
            ContentView().onAppear(perform: {
                
            })
        }.windowToolbarStyle(UnifiedWindowToolbarStyle(showsTitle: false))
        #if os(macOS)
        Settings {
            SettingsView()
        }
        #endif
    }
}
