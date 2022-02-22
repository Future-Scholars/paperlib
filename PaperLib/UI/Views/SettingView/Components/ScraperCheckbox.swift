//
//  ScraperCheckbox.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct ScraperCheckbox: View {

    private var description: String

    @State private var scraperPreference: Bool
    private var scraperPreferenceName: String

    @State private var apiKeyPreference: String
    private var apiKeyPreferenceName: String?

    init(description: String, scraperPreferenceName: String, apiKeyPreferenceName: String?) {
        self.description = description

        self.scraperPreferenceName = scraperPreferenceName
        _scraperPreference = .init(initialValue: UserDefaults.standard.bool(forKey: scraperPreferenceName))

        self.apiKeyPreferenceName = apiKeyPreferenceName
        if let apiKeyPreferenceName = apiKeyPreferenceName {
            _apiKeyPreference = .init(initialValue: UserDefaults.standard.string(forKey: apiKeyPreferenceName) ?? "")
        } else {
            _apiKeyPreference = .init(initialValue: "")
        }
    }

    var body: some View {
        HStack(alignment: .top) {
            Text(description).frame(width: 230, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
            Toggle("", isOn: $scraperPreference)
                    .toggleStyle(.checkbox)
            if apiKeyPreferenceName != nil {
                TextField("API Key", text: $apiKeyPreference)
                    .toggleStyle(.checkbox)
            }
        }
        .onChange(of: scraperPreference, perform: { scraperPreference in
            UserDefaults.standard.set(scraperPreference, forKey: scraperPreferenceName)
        })
        .onChange(of: apiKeyPreference, perform: { apiKeyPreference in
            if let apiKeyPreferenceName = apiKeyPreferenceName {
                UserDefaults.standard.set(apiKeyPreference, forKey: apiKeyPreferenceName)
            }
        })
    }
}
