//
//  InteractorsContainer.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import SwiftUI

// MARK: - DIContainer

struct DIContainer: EnvironmentKey {
    let appState: Store<AppState>
    let interactors: Interactors

    init(appState: Store<AppState>, interactors: Interactors) {
        self.appState = appState
        self.interactors = interactors
    }

    init(appState: AppState, interactors: Interactors) {
        self.init(appState: Store<AppState>(appState), interactors: interactors)
    }

    static var defaultValue: Self { Self.default }

    private static let `default` = Self(appState: AppState(), interactors: .stub)
}

extension EnvironmentValues {
    var injected: DIContainer {
        get { self[DIContainer.self] }
        set { self[DIContainer.self] = newValue }
    }
}

extension DIContainer {
    struct Interactors {
        let entitiesInteractor: EntitiesInteractor

        init(entitiesInteractor: EntitiesInteractor) {
            self.entitiesInteractor = entitiesInteractor
        }

        static var stub: Self {
            .init(entitiesInteractor: StubEntitiesInteractor())
        }
    }
}

// MARK: - Injection in the view hierarchy

extension View {
    func inject(_ appState: AppState,
                _ interactors: DIContainer.Interactors) -> some View {
        let container = DIContainer(appState: .init(appState),
                                    interactors: interactors)
        return inject(container)
    }

    func inject(_ container: DIContainer) -> some View {
        return modifier(RootViewAppearance())
            .environment(\.injected, container)
    }
}
