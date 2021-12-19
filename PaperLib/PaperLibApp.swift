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
    @StateObject var updaterViewModel = UpdaterViewModel()

    init() {
        environment = AppEnvironment.bootstrap()
    }

    var body: some Scene {
        WindowGroup {
            ContentView(container: self.environment.container)
                .handlesExternalEvents(preferring: Set(arrayLiteral: "{path of URL?}"), allowing: Set(arrayLiteral: "*"))
                .onOpenURL(perform: {
                    self.environment.container.interactors.entitiesInteractor.handleChromePluginUrl($0)
                })
        }
        .windowToolbarStyle(UnifiedWindowToolbarStyle(showsTitle: false))
        .commands {
            CommandGroup(after: .appInfo) {
                CheckForUpdatesView(updaterViewModel: updaterViewModel)
            }
        }
        .handlesExternalEvents(matching: Set(arrayLiteral: "{same path of URL?}"))
        Settings {
            SettingsView().inject(self.environment.container)
        }
    }
}
