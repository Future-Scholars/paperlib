//
//  CloudPage.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct CloudPage: View {
    @Environment(\.injected) private var injected: DIContainer

    @AppStorage("syncAPIKey") private var syncAPIKey = ""
    @AppStorage("useSync") private var useSync = false

    var body: some View {
        VStack(alignment: .leading) {
            HStack(alignment: .top) {
                Text("Cloud Sync API Key is the your identification and authentication on the cloud database. Never share it with others.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                TextField("", text: $syncAPIKey)
                    .disabled(useSync)
                Button(
                    action: {
                        useSync.toggle()
                    },
                    label: {
                        if useSync {
                            Text("Logout")
                        } else {
                            Text("Login")
                        }
                    }
                )
            }
            .onChange(of: syncAPIKey, perform: { syncAPIKey in
                UserDefaults.standard.set(syncAPIKey, forKey: "syncAPIKey")
            })
            .onChange(of: useSync, perform: onToggleUseSync)
            .padding(.bottom, 10)

            HStack(alignment: .top) {
                Text("Migrate the local database to the cloud sync database.").frame(width: 250, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                Button(
                    action: {
                        injected.interactors.entitiesInteractor.migrateLocaltoSync()
                    },
                    label: {
                        Label("Migrate", systemImage: "icloud.and.arrow.up.fill")
                    }
                )
                .disabled(!useSync)
            }
            .padding(.bottom, 10)
        }
    }

    func onToggleUseSync (useSync: Bool) {
        UserDefaults.standard.set(useSync, forKey: "useSync")

        if !syncAPIKey.isEmpty {
            injected.interactors.entitiesInteractor.openLib()
        }
    }
}
