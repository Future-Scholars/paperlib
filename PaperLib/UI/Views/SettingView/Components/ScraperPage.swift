//
//  ScraperPage.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct ScraperPage: View {
    @Environment(\.injected) private var injected: DIContainer

    @AppStorage("pdfBuiltinScraper") private var pdfBuiltinScraper = false
    @AppStorage("ieeeAPIKey") private var ieeeAPIKey = ""

    @AppStorage("allowRoutineMatch") private var allowRoutineMatch = false
    @AppStorage("rematchInterval") private var rematchInterval = 7

    var body: some View {
        VStack(alignment: .leading) {

            Text("Turn on/off Metadata Scrapers.").bold().font(.caption).padding(.bottom, -5)
            Divider()

            VStack(alignment: .leading) {
                ScraperCheckbox(description: "PDF's builtin metadata", scraperPreferenceName: "pdfBuiltinScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "arXiv", scraperPreferenceName: "arXivScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "DOI.org", scraperPreferenceName: "doiScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "Paperlib's Title Extrator", scraperPreferenceName: "teScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "DBLP", scraperPreferenceName: "dblpScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "The CVF", scraperPreferenceName: "cvfScraper", apiKeyPreferenceName: nil)
                ScraperCheckbox(description: "IEEE Xplore", scraperPreferenceName: "ieeeScraper", apiKeyPreferenceName: "ieeeAPIKey")
            }
            .padding(.bottom, 20)

            Text("Check publication status for preprint papers automatically.").bold().font(.caption).padding(.bottom, -5)
            Divider()

            HStack(alignment: .top) {
                Text("Turn on/off").frame(width: 230, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption).padding(.top, 5)
                Toggle("", isOn: $allowRoutineMatch)
                    .toggleStyle(.checkbox)
                Picker("", selection: $rematchInterval) {
                    ForEach([1, 7, 30], id: \.self) {
                        Text("\($0) day(s)")
                    }
                }.pickerStyle(MenuPickerStyle()).padding(.leading, -8)
            }
            .onChange(of: allowRoutineMatch, perform: { allowRoutineMatch in
                UserDefaults.standard.set(allowRoutineMatch, forKey: "allowRoutineMatch")
            })
            .onChange(of: rematchInterval, perform: { rematchInterval in
                UserDefaults.standard.set(rematchInterval, forKey: "rematchInterval")
                injected.interactors.entitiesInteractor.setRoutineTimer()
            })
            .padding(.top, 10)

        }
    }
}
