//
//  AppEnvironment.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine

struct AppEnvironment {
    let container: DIContainer
}

extension AppEnvironment {
    static func bootstrap() -> AppEnvironment {
        let appState = Store<AppState>(AppState())

        let repositories = configuredRepositories(appState: appState)
        let interactors = configuredInteractors(appState: appState,
                                                repositories: repositories)
        let diContainer = DIContainer(appState: appState, interactors: interactors)

        return AppEnvironment(container: diContainer)
    }

    private static func configuredRepositories(appState _: Store<AppState>) -> DIContainer.Repositories {
        let dbRepository = RealDBRepository()
        let fileRepository = RealFileDBRepository()
        let webRepository = RealWebRepository()

        return .init(dbRepository: dbRepository, fileRepository: fileRepository, webRepository: webRepository)
    }

    private static func configuredInteractors(appState: Store<AppState>,
                                              repositories: DIContainer.Repositories) -> DIContainer.Interactors {
        let entitiesInteractor = RealEntitiesInteractor(
            appState: appState,
            dbRepository: repositories.dbRepository,
            fileRepository: repositories.fileRepository,
            webRepository: repositories.webRepository
        )

        return .init(entitiesInteractor: entitiesInteractor)
    }
}

extension DIContainer {
    struct Repositories {
        let dbRepository: DBRepository
        let fileRepository: FileRepository
        let webRepository: WebRepository
    }
}
