//
//  AppState.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

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

struct SharedState {
    var selection = SelectionState()
    var viewState = ViewState()
    var sharedData = SharedData()
}

// MARK: -

struct SelectionState {
    var selectedCategorizer = StateWrapper(nil as String?)
    var selectedIds = StateWrapper(Set<ObjectId>.init())
}

struct ViewState {
    var entitiesCount = StateWrapper(0)

    var entitiesViewSwitcher = StateWrapper(0)
    var entitiesViewSortSwitcher = StateWrapper(nil as String?)

    var isEditViewShown = StateWrapper(false)
    var isTagViewShown = StateWrapper(false)
    var isFolderViewShown = StateWrapper(false)
    var isNoteViewShown = StateWrapper(false)

    var alertInformation = StateWrapper(nil as String?)

    var processingQueueCount = StateWrapper(0)
    var realmReinited = StateWrapper(nil as Date?)

    var searchMode = StateWrapper(SearchMode.general)
}

struct SharedData {
    var searchQuery = StateWrapper(nil as String?)
    var editEntityDraft = StateWrapper(PaperEntityDraft())
}
