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

class StateWrapper<T: Equatable> {
    private var _state: T
    private var _lastState: T

    var value: T {
        get {
            return self._state
        }
        set {
            self._state = newValue
            if newValue != self._lastState {
                self._lastState = newValue
                self.publisher.send(newValue)
            }
        }
    }
    var binding: Binding<T> {
        Binding<T>(
            get: {
                return self._state
            },
            set: {
                self._state = $0
                if $0 != self._lastState {
                    self._lastState = $0
                    self.publisher.send($0)
                }
            }
        )
    }
    let publisher: CurrentValueSubject<T, Never>

    init(_ initState: T) {
        _state = initState
        _lastState = initState
        self.publisher = CurrentValueSubject<T, Never>(_state)
    }

}

struct SelectionState {
    var selectedCategorizer = StateWrapper("lib-all" as String?)
    var selectedIds = StateWrapper(Set<ObjectId>.init())
}

struct ViewState {
    var entitiesViewSwitcher = StateWrapper(0)
    var entitiesViewSortSwitcher = StateWrapper("addTime" as String)
    var isEditViewShown = StateWrapper(false)
    var isTagViewShown = StateWrapper(false)
    var isFolderViewShown = StateWrapper(false)
    var isNoteViewShown = StateWrapper(false)
    var isDeleteConfirmationViewShown = StateWrapper(false)
}

struct SharedData {
    var searchQuery = StateWrapper("" as String)
    var editEntityDraft = StateWrapper(PaperEntityDraft())
}

struct SharedState {
    var selection = SelectionState()
    var viewState = ViewState()
    var sharedData = SharedData()
}
