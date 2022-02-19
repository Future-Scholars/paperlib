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
    var receiveSignals = ReceiveSignals()
}

extension AppState {

    struct ReceiveSignals: Equatable {
        var settingOpened = false
        var sideBar = 0
        var mainView = 0
        var processingCount = 0
        var appLibMoved = Date()
    }
}

func == (lhs: AppState, rhs: AppState) -> Bool {
    return lhs.receiveSignals == rhs.receiveSignals
}
