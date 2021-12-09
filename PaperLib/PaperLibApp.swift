//
//  PaperLibApp.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import SwiftUI

@main
struct PaperLibApp: App {
    private let environment: AppEnvironment
    
    init() {
        self.environment = AppEnvironment.bootstrap()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView(container: self.environment.container)
        }.windowToolbarStyle(UnifiedWindowToolbarStyle(showsTitle: false))
        Settings {
            SettingsView()
        }
    }
}
