//
//  Preference.swift
//  PaperLib
//
//  Created by GeoffreyChen on 19/02/2022.
//

import Foundation

extension UserDefaults {
    @objc var preferColorTheme: String {
        get {
            return string(forKey: "preferColorTheme") ?? "System Default"
        }
        set {
            set(newValue, forKey: "preferColorTheme")
        }
    }

    @objc var invertColor: Bool {
        get {
            return bool(forKey: "invertColor")
        }
        set {
            set(newValue, forKey: "invertColor")
        }
    }
}

func registerPreference () {
    UserDefaults.standard.register(
        defaults:
            [
                "appLibFolder": FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("paperlib").absoluteString,
                "invertColor": false,
                "preferColorTheme": "System Default",
                "deleteSourceFile": true,
                "showSidebarCount": true,
                "allowRoutineMatch": false,
                "rematchInterval": 7,
                "syncAPIKey": "",
                "useSync": false,
                "exportReplacement": Data.init(),
                "enableExportReplacement": false,

                // Scraper
                "pdfBuiltinScraper": true,
                "arXivScraper": true,
                "doiScraper": true,
                "teScraper": true,
                "ieeeScraper": true,
                "dblpScraper": true,
                "cvfScraper": true,

                // ScraperAPIKey
                "ieeeAPIKey": ""
            ]
    )
}
