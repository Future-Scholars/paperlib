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
        registerPreference()
        let sharedState = SharedState()
        let repositories = configuredRepositories(sharedState: sharedState)
        let interactors = configuredInteractors(sharedState: sharedState, repositories: repositories)
        let diContainer = DIContainer(interactors: interactors, sharedState: sharedState)

        return AppEnvironment(container: diContainer)
    }

    private static func configuredRepositories(sharedState: SharedState) -> DIContainer.Repositories {
        let dbRepository = RealDBRepository(sharedState: sharedState)
        let fileRepository = RealFileDBRepository()
        let webRepository = RealWebRepository()
        let cacheRepository = RealCacheRepository(sharedState: sharedState)

        return .init(dbRepository: dbRepository, fileRepository: fileRepository, webRepository: webRepository, cacheRepository: cacheRepository)
    }

    private static func configuredInteractors(sharedState: SharedState, repositories: DIContainer.Repositories) -> DIContainer.Interactors {
        let entitiesInteractor = RealEntitiesInteractor(
            sharedState: sharedState,
            dbRepository: repositories.dbRepository,
            fileRepository: repositories.fileRepository,
            webRepository: repositories.webRepository,
            cacheRepository: repositories.cacheRepository
        )

        return .init(entitiesInteractor: entitiesInteractor)
    }
}

extension DIContainer {
    struct Repositories {
        let dbRepository: DBRepository
        let fileRepository: FileRepository
        let webRepository: WebRepository
        let cacheRepository: CacheRepository
    }
}
