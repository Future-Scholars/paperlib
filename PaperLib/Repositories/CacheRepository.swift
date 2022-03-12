//
//  CacheRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 11/03/2022.
//

import Combine
import CoreData
import PDFKit
import RealmSwift
import os.log

protocol CacheRepository {
    func getConfig() async -> Realm.Configuration
    func initCache(reinit: Bool)

    func filter(entities: Results<PaperEntity>, query: String?) -> AnyPublisher<Results<PaperEntity>, CacheError>
    func add(entities: Results<PaperEntity>) -> AnyPublisher<Bool, CacheError>
    func delete(ids: [ObjectId]) -> AnyPublisher<Bool, CacheError>
}

enum CacheError: Error {
    case realmNilError
    case filterError(error: Error)
    case addError(error: Error)
    case deleteError(error: Error)
}

class RealCacheRepository: CacheRepository {
    let logger: Logger
    let queue: DispatchQueue = .init(label: "cacheQueue")
    var sharedState: SharedState

    var cacheSchemaVersion: UInt64 = 1
    var config: Realm.Configuration?
    var inited: Bool = false

    let cachePublisher: CurrentValueSubject<Realm?, Never> = .init(nil)

    init(sharedState: SharedState) {
        self.sharedState = sharedState
        self.logger = Logger()

        self.initCache()
    }

    func getConfig() -> Realm.Configuration {
        self.logger.info("[Cache] Opening local cache...")
        let pathStr = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?.appendingPathComponent("dev.geo.PaperLib").absoluteString

        var config = Realm.Configuration(
            schemaVersion: self.cacheSchemaVersion,
            objectTypes: [PaperEntityCache.self]
        )

        let pathURL = URL(string: pathStr ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("paperlib").absoluteString)
        if let pathURL = pathURL {
            do {
                try FileManager.default.createDirectory(at: pathURL, withIntermediateDirectories: true, attributes: nil)
                config.fileURL = pathURL.appendingPathComponent("cache.realm")
            } catch let error {
                self.sharedState.viewState.alertInformation.value = "[Cache] Cannot create folder: \(String(describing: error)) \(Date())"
                self.logger.error("[Cache] Cannot create folder: \(String(describing: error))")
            }
        } else {
            self.logger.error("[Cache] Cannot set custom path \(String(describing: pathStr)) for local cache.")
        }

        self.config = config
        return config
    }

    func initCache(reinit: Bool = false) {
        if !self.inited || reinit {
            _ = self.getConfig()
            self.inited = true
        }

        var cache: Realm?

        do {
            cache = try Realm(configuration: self.config!)
        } catch let error {
            DispatchQueue.main.async {
                self.sharedState.viewState.alertInformation.value = "[Cache] Cannot open local cache: \(String(describing: error)) \(Date())"
            }
            self.logger.error("[Cache] Cannot open local cache: \(String(describing: error))")
        }
        cachePublisher.send(cache)
    }

    func filter(entities: Results<PaperEntity>, query: String?) -> AnyPublisher<Results<PaperEntity>, CacheError> {
        if self.sharedState.viewState.searchMode.value == .fulltext {
            return self.add(entities: entities)
                .flatMap { _ -> AnyPublisher<Realm?, Never> in
                    return self.cachePublisher.eraseToAnyPublisher()
                }
                .flatMap { cache -> AnyPublisher<Results<PaperEntity>, CacheError> in
                    if let cache = cache {
                        let cachedEntities = cache.objects(PaperEntityCache.self)

                        var filteredIds: Set<ObjectId>
                        if let query = query, !query.isEmpty {
                            let filteredEntities = cachedEntities.filter("(fulltext contains[cd] '\(query)')")
                            filteredIds = Set(filteredEntities.map({ entity in entity.id }))
                        } else {
                            filteredIds = Set(entities.map({ entity in entity.id }))
                        }

                        return entities.filter("id IN %@", filteredIds).collectionPublisher
                            .mapError { error in
                                return CacheError.filterError(error: error)
                            }
                            .eraseToAnyPublisher()

                    } else {
                        self.logger.notice("[Cache] Cache nil (filter): \(String(describing: CacheError.realmNilError))")
                        return Empty(completeImmediately: false).setFailureType(to: CacheError.self).eraseToAnyPublisher()
                    }
                }
                .eraseToAnyPublisher()
        } else {
            return CurrentValueSubject(entities).eraseToAnyPublisher()
        }
    }

    func add(entities: Results<PaperEntity>) -> AnyPublisher<Bool, CacheError> {
        return cachePublisher
            .flatMap { cache -> AnyPublisher<Results<PaperEntity>, CacheError> in
                if let cache = cache {
                    let cachedEntities = cache.objects(PaperEntityCache.self)

                    let cachedIds = Set(cachedEntities.map({ entity in entity.id }))

                    let uncahedEntities = entities.filter("!(id IN %@)", cachedIds)

                    return uncahedEntities.collectionPublisher
                        .mapError { error in
                            return CacheError.addError(error: error)
                        }
                        .eraseToAnyPublisher()
                } else {
                    self.logger.notice("[Cache] Cache nil (filter): \(String(describing: CacheError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: CacheError.self).eraseToAnyPublisher()
                }
            }
            .flatMap { uncachedEntities -> AnyPublisher<Bool, CacheError> in
                var publisherList: [AnyPublisher<Bool, CacheError>] = .init()

                uncachedEntities.forEach { entity in
                    let publisher = Just<PaperEntity>
                        .withErrorType(entity, CacheError.self)
                        .flatMap { entity in
                            Future<PaperEntityCache?, Never> { promise in
                                let pdfURL = constructURL(entity.mainURL)
                                let entityCache = PaperEntityCache(id: entity.id, fulltext: "")

                                DispatchQueue.global(qos: .background).async {
                                    let document = PDFDocument(url: pdfURL!)
                                    if let pdf = document {
                                        entityCache.fulltext = pdf.string ?? ""
                                        DispatchQueue.main.sync {
                                            promise(.success(entityCache))
                                        }
                                    } else {
                                        DispatchQueue.main.sync {
                                            promise(.success(nil))
                                        }
                                    }
                                }
                            }
                        }
                        .flatMap { entityCache in
                            return self.cachePublisher
                                .zip(
                                    CurrentValueSubject(entityCache)
                                        .eraseToAnyPublisher()
                                )
                        }
                        .flatMap { (cache, entityCache) -> AnyPublisher<Bool, CacheError> in
                            if let cache = cache, let entityCache = entityCache {
                                do {
                                    try cache.safeWrite {
                                        cache.add(entityCache)
                                    }
                                } catch let error {
                                    print(error)
                                }
                            }
                            return Just<Bool>
                                .withErrorType(true, CacheError.self)
                                .eraseToAnyPublisher()
                        }
                        .eraseToAnyPublisher()

                    publisherList.append(publisher)
                }

                if publisherList.count > 0 {
                    return Publishers.MergeMany(publisherList)
                        .collect(publisherList.count)
                        .flatMap { _ -> AnyPublisher<Bool, CacheError> in
                            return Just<Bool>
                                .withErrorType(true, CacheError.self)
                                .eraseToAnyPublisher()
                        }
                        .eraseToAnyPublisher()
                } else {
                    return Just<Bool>
                            .withErrorType(true, CacheError.self)
                            .eraseToAnyPublisher()
                }

            }
            .eraseToAnyPublisher()
    }

    func delete(ids: [ObjectId]) -> AnyPublisher<Bool, CacheError> {
        return cachePublisher
            .flatMap { cache -> AnyPublisher<Bool, CacheError> in
                if let cache = cache {
                    let deleteEntities = cache.objects(PaperEntityCache.self).filter("!(id IN %@)", ids)

                    do {
                        try cache.safeWrite {
                            cache.delete(deleteEntities)
                        }
                    } catch let err {
                        self.logger.error("Cannot delete entities. \(String(describing: err))")
                        return Fail(error: CacheError.deleteError(error: err)).eraseToAnyPublisher()
                    }
                    return Just<Bool>
                        .withErrorType(true, CacheError.self)
                        .eraseToAnyPublisher()

                } else {
                    self.logger.notice("[Cache] Cache nil (filter): \(String(describing: CacheError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: CacheError.self).eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }
}
