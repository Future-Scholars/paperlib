//
//  AppState.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

struct AppState: Equatable {
    var setting = Setting()
    var receiveSignals = ReceiveSignals()
}

extension AppState {
    struct Setting: Equatable {
        var settingOpened = false
        var appLibFolder = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""
        var colorScheme = UserDefaults.standard.string(forKey: "preferColorTheme") ?? "System Default"
        var invertColor = UserDefaults.standard.bool(forKey: "invertColor")
        var ieeeAPIKey = UserDefaults.standard.string(forKey: "ieeeAPIKey") ?? ""
        var allowFetchPDFMeta = UserDefaults.standard.bool(forKey: "allowFetchPDFMeta")
        var deleteSourceFile = UserDefaults.standard.bool(forKey: "deleteSourceFile")
        var exportReplacement = UserDefaults.standard.data(forKey: "exportReplacement")
        var enableExportReplacement = UserDefaults.standard.bool(forKey: "enableExportReplacement")
        var syncAPIKey = UserDefaults.standard.string(forKey: "syncAPIKey") ?? ""
        var useSync = UserDefaults.standard.bool(forKey: "useSync")
    }

    struct ReceiveSignals: Equatable {
        var sideBar = 0
        var mainView = 0
        var processingCount = 0
        var appLibMoved = Date()
    }
}

func == (lhs: AppState, rhs: AppState) -> Bool {
    return lhs.setting == rhs.setting && lhs.receiveSignals == rhs.receiveSignals
}
