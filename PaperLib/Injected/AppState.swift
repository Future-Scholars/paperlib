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
        var appLibMoved = Date()
        var appLibFolder = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""
        var colorScheme = UserDefaults.standard.string(forKey: "preferColorTheme") ?? "System Default"
        var invertColor = UserDefaults.standard.bool(forKey: "invertColor")
        var ieeeAPIKey = UserDefaults.standard.string(forKey: "ieeeAPIKey")
        var allowFetchPDFMeta = UserDefaults.standard.bool(forKey: "allowFetchPDFMeta")
        var deleteSourceFile = UserDefaults.standard.bool(forKey: "deleteSourceFile")
    }

    struct ReceiveSignals: Equatable {
        var sideBarTag = 0
        var sideBarFolder = 0
        var mainViewEntities = 0
        var mainViewSelectedEntities = 0
        var fetchingEntities = 0
    }
}

func == (lhs: AppState, rhs: AppState) -> Bool {
    return lhs.setting == rhs.setting && lhs.receiveSignals == rhs.receiveSignals
}
