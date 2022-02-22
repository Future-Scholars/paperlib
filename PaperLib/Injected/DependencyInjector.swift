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
    let sharedState: SharedState
    let interactors: Interactors

    init(interactors: Interactors, sharedState: SharedState) {
        self.sharedState = sharedState
        self.interactors = interactors
    }

    static var defaultValue: Self { Self.default }

    private static let `default` = Self(interactors: .stub, sharedState: SharedState())
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
    func inject(_ interactors: DIContainer.Interactors,
                _ sharedState: SharedState
    ) -> some View {
        let container = DIContainer(interactors: interactors,
                                    sharedState: sharedState
        )
        return inject(container)
    }

    func inject(_ container: DIContainer) -> some View {
        return modifier(RootViewAppearance())
            .environment(\.injected, container)
    }
}
