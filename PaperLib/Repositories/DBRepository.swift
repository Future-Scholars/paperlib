//
//  DBRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import CoreData
import RealmSwift
import os.log

protocol DBRepository {
    func getConfig() async -> Realm.Configuration
    func getLocalConfig() -> Realm.Configuration
    func getCloudConfig() async -> Realm.Configuration
    func migrate(migration: Migration, oldSchemaVersion: UInt64)
    func migrateLocaltoCloud()
    func logoutCloud() async
    func initRealm(reinit: Bool)

    func entities() -> AnyPublisher<Results<PaperEntity>, Error>
    func entities(ids: Set<ObjectId>?, search: String?, publication: String?, flag: Bool, tags: [String], folders: [String], sort: String) -> AnyPublisher<Results<PaperEntity>, Error>
    func categorizers<T: PaperCategorizer>(categorizerType: T.Type) -> AnyPublisher<Results<T>, Error>

    func delete(ids: [ObjectId]) -> AnyPublisher<[String], DBError>
    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type?) -> AnyPublisher<Bool, DBError>

    func update(from entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], DBError>
}

public extension Realm {
    func safeWrite(_ block: () throws -> Void) throws {
        if isInWriteTransaction {
            try block()
        } else {
            try write(block)
        }
    }
}

enum DBError: Error {
    case realmNilError
    case deleteError(error: Error)
    case addError(error: Error)
    case updateError(error: Error)
}

class RealDBRepository: DBRepository {
    let logger: Logger
    var sharedState: SharedState

    var realmSchemaVersion: UInt64 = 5
    var cloudConfig: Realm.Configuration?
    var localConfig: Realm.Configuration?
    var app: App?
    var inited: Bool = false

    let realmPublisher: CurrentValueSubject<Realm?, Never> = .init(nil)

    init(sharedState: SharedState) {
        self.sharedState = sharedState
        self.logger = Logger()

        self.initRealm()
    }

    func getConfig() async -> Realm.Configuration {
        if UserDefaults.standard.bool(forKey: "useSync") && !(UserDefaults.standard.string(forKey: "syncAPIKey") ?? "").isEmpty {
            return await getCloudConfig()
        } else {
            self.cloudConfig = nil
            return getLocalConfig()
        }
    }

    func getLocalConfig() -> Realm.Configuration {
        self.logger.info("[DB] Opening local db...")
        let pathStr = UserDefaults.standard.string(forKey: "appLibFolder")

        var config = Realm.Configuration(
            schemaVersion: self.realmSchemaVersion,
            migrationBlock: self.migrate,
            objectTypes: [PaperEntity.self, PaperTag.self, PaperFolder.self]
        )

        let pathURL = URL(string: pathStr ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("paperlib").absoluteString)
        if let pathURL = pathURL {
            do {
                try FileManager.default.createDirectory(at: pathURL, withIntermediateDirectories: true, attributes: nil)
                config.fileURL = pathURL.appendingPathComponent("default.realm")
                UserDefaults.standard.set(pathURL.absoluteString, forKey: "appLibFolder")
            } catch let error {
                self.sharedState.viewState.alertInformation.value = "[DB] Cannot create folder: \(String(describing: error)) \(Date())"
                self.logger.error("[DB] Cannot create folder: \(String(describing: error))")
            }
        } else {
            self.logger.error("[DB] Cannot set custom path \(String(describing: pathStr)) for local database.")
        }

        self.localConfig = config
        return config
    }

    func getCloudConfig() async -> Realm.Configuration {
        self.logger.info("[DB] Opening sync db...")

        if let cloudUser = await self.loginCloud() {
            self.app!.syncManager.errorHandler = { error, _ in
                self.logger.error("[DB] Sync: \(String(describing: error))")
            }

            let partitionValue = cloudUser.id
            var config = cloudUser.configuration(
                partitionValue: partitionValue
            )
            config.schemaVersion = self.realmSchemaVersion
            config.migrationBlock = self.migrate
            config.objectTypes = [PaperEntity.self, PaperTag.self, PaperFolder.self]

            self.cloudConfig = config
            return config
        } else {
            self.logger.error("[DB] Cannot login to sync db.")
            UserDefaults.standard.set(false, forKey: "useSync")
            return self.getLocalConfig()
        }
    }

    func loginCloud() async -> User? {
        if self.app == nil {
            self.app = App(id: "paperlib-iadbj")
        }
        do {
            let credentials = Credentials.userAPIKey(UserDefaults.standard.string(forKey: "syncAPIKey")!)
            return self.app!.currentUser == nil ? try await self.app!.login(credentials: credentials) : self.app!.currentUser
        } catch let error {
            DispatchQueue.main.async {
                self.sharedState.viewState.alertInformation.value = "[DB] Cannot login to sync db: \(String(describing: error)) \(Date())"
            }
            self.logger.error("[DB] Cannot login to sync db. \(String(describing: error))")
            return nil
        }
    }

    func logoutCloud() async {
        if self.app == nil {
            self.app = App(id: "paperlib-iadbj")
        }
        do {
            try await self.app!.currentUser?.logOut()
        } catch let error {
            self.logger.error("[DB]Cannot logout from sync db. \(String(describing: error))")
        }
    }

    func migrate(migration: Migration, oldSchemaVersion: UInt64) {
        self.logger.info("[DB] Dataset Version: \(oldSchemaVersion)")
        if oldSchemaVersion == 1 {
            migration.enumerateObjects(ofType: PaperEntity.className()) { oldObject, newObject in
                newObject!["id"] = oldObject!["id"]
                newObject!["addTime"] = oldObject!["addTime"]
                newObject!["title"] = oldObject!["title"] ?? ""
                newObject!["authors"] = oldObject!["authors"] ?? ""
                newObject!["publication"] = oldObject!["publication"] ?? ""
                newObject!["pubTime"] = oldObject!["pubTime"] ?? ""
                newObject!["pubType"] = oldObject!["pubType"] ?? 2
                newObject!["doi"] = oldObject!["doi"] ?? ""
                newObject!["arxiv"] = oldObject!["arxiv"] ?? ""
                newObject!["rating"] = oldObject!["rating"] ?? 0
                newObject!["flag"] = oldObject!["flag"] ?? false

                newObject!["mainURL"] = URL(string: newObject!["mainURL"] as? String ?? "")?.lastPathComponent ?? ""
                var newObjectSupURLs: [String] = .init()

                if let oldSupURLs = newObject!["supURLs"] as? List<DynamicObject> {
                    unsafeBitCast(oldSupURLs, to: List<String>.self).forEach { supURL in
                        if let fileName = URL(string: supURL)?.lastPathComponent {
                            newObjectSupURLs.append(fileName)
                        }
                    }
                }
                newObject!["supURLs"] = newObjectSupURLs
                newObject!["_id"] = oldObject!["id"]

            }

            migration.enumerateObjects(ofType: PaperTag.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
            migration.enumerateObjects(ofType: PaperFolder.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
        }

        if oldSchemaVersion == 2 {
            migration.enumerateObjects(ofType: PaperEntity.className()) { oldObject, newObject in

                newObject!["mainURL"] = URL(string: newObject!["mainURL"] as? String ?? "")?.lastPathComponent ?? ""
                var newObjectSupURLs: [String] = .init()

                if let oldSupURLs = newObject!["supURLs"] as? List<DynamicObject> {
                    unsafeBitCast(oldSupURLs, to: List<String>.self).forEach { supURL in
                        if let fileName = URL(string: supURL)?.lastPathComponent {
                            newObjectSupURLs.append(fileName)
                        }
                    }
                }
                newObject!["supURLs"] = newObjectSupURLs
                newObject!["_id"] = oldObject!["id"]
            }
            migration.enumerateObjects(ofType: PaperTag.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
            migration.enumerateObjects(ofType: PaperFolder.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
        }

        if oldSchemaVersion == 3 {
            migration.enumerateObjects(ofType: PaperEntity.className()) { oldObject, newObject in
                newObject!["_id"] = oldObject!["id"]
            }
            migration.enumerateObjects(ofType: PaperTag.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
            migration.enumerateObjects(ofType: PaperFolder.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
        }

        if oldSchemaVersion == 4 {
            migration.enumerateObjects(ofType: PaperTag.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
            migration.enumerateObjects(ofType: PaperFolder.className()) { _, newObject in
                newObject!["_id"] = ObjectId.generate()
            }
        }
    }

    func migrateLocaltoCloud() {
        Task {
            let localConfig = self.getLocalConfig()
            do {
                let localRealm = try await Realm(configuration: localConfig)
                let entities = localRealm.objects(PaperEntity.self)

                let entityDrafts = Array(entities).map({et -> PaperEntityDraft in
                    let entityDraft = PaperEntityDraft(from: et)
                    return entityDraft
                })

                self.update(from: entityDrafts)
                    .sink(receiveCompletion: {completion in
                        switch completion {
                        case .failure(let error): do {
                            DispatchQueue.main.async {
                                self.sharedState.viewState.alertInformation.value = "[DB] Cannot migrate from local to cloud: \(String(describing: error)) \(Date())"
                            }
                            self.logger.error("[DB] Cannot migrate from local to cloud: \(String(describing: error))")
                        }
                        case .finished: do {
                            self.logger.info("[DB] Migrate local to cloud successful.")
                        }
                        }
                    }, receiveValue: { _ in })
                    .store(in: CancelBag())

            } catch let error {
                DispatchQueue.main.async {
                    self.sharedState.viewState.alertInformation.value = "[DB] Cannot migrate from local to cloud: \(String(describing: error)) \(Date())"
                }
                self.logger.error("[DB] Mirgrate local to cloud failed: \(String(describing: error))")
            }
        }
    }

    func initRealm(reinit: Bool = false) {
        Task {
            if !self.inited || reinit {
                await self.logoutCloud()
                _ = await self.getConfig()
                self.inited = true
            }

            var realm: Realm?

            if self.cloudConfig == nil {
                do {
                    realm = try await Realm(configuration: self.localConfig!)
                } catch let error {
                    DispatchQueue.main.async {
                        self.sharedState.viewState.alertInformation.value = "[DB] Cannot open local database: \(String(describing: error)) \(Date())"
                    }
                    self.logger.error("[DB] Cannot open local database: \(String(describing: error))")
                }
            } else {
                do {
                    realm = try await Realm(configuration: self.cloudConfig!)
                } catch let error {
                    DispatchQueue.main.async {
                        self.sharedState.viewState.alertInformation.value = "[DB] Cannot open cloud database: \(String(describing: error)) \(Date())"
                    }
                    self.logger.error("[DB] Cannot open cloud database: \(String(describing: error))")
                }
            }
            self.realmPublisher.send(realm)

            if reinit {
                self.sharedState.viewState.realmReinited.value = Date()
            }
        }
    }

    // MARK: - Select

    func entities() -> AnyPublisher<Results<PaperEntity>, Error> {
        return realmPublisher
            .flatMap { realm -> AnyPublisher<Results<PaperEntity>, Error> in
                if let realm = realm {
                    return realm.objects(PaperEntity.self).collectionPublisher.eraseToAnyPublisher()
                } else {
                    self.logger.notice("[DB] Realm nil (entities): \(String(describing: DBError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: Error.self).eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }

    func entities(ids: Set<ObjectId>?, search: String?, publication: String?, flag: Bool, tags: [String], folders: [String], sort: String) -> AnyPublisher<Results<PaperEntity>, Error> {
        return self.entities()
            .flatMap { results -> AnyPublisher<Results<PaperEntity>, Error> in
                self.sharedState.viewState.entitiesCount.value = results.count

                var filterFormat = ""

                if let search = search, !search.isEmpty {
                    switch self.sharedState.viewState.searchMode.value {
                    case .general: do {
                        filterFormat += "(title contains[cd] \"\(formatString(search)!)\" OR authors contains[cd] \"\(formatString(search)!)\" OR publication contains[cd] \"\(formatString(search)!)\" OR note contains[cd] \"\(formatString(search)!)\") AND "
                    }
                    case .fulltext: do {
                    }
                    case .advanced: do {
                        filterFormat += "(\(search.replacingOccurrences(of: "contains", with: "contains[cd]") )) AND "
                    }
                    }
                }

                if publication != nil {
                    filterFormat += "(publication contains[cd] \"\(formatString(publication)!)\") AND "
                }
                if flag {
                    filterFormat += "(flag == true) AND "
                }
                tags.forEach { tag in
                    filterFormat += "(ANY tags.name == \"\(String(tag[String.Index(utf16Offset: 4, in: tag)...]))\") AND "
                }
                folders.forEach { folder in
                    filterFormat += "(ANY folders.name == \"\(String(folder[String.Index(utf16Offset: 7, in: folder)...]))\") AND "
                }

                var publisher: RealmPublishers.Value<Results<PaperEntity>>

                if ids != nil && !filterFormat.isEmpty {
                    return Empty(completeImmediately: false).setFailureType(to: Error.self).eraseToAnyPublisher()
                } else if let ids = ids {
                    return results.filter("id IN %@", ids).collectionPublisher.eraseToAnyPublisher()
                } else if !filterFormat.isEmpty {
                    filterFormat = String(filterFormat[..<String.Index(utf16Offset: filterFormat.count - 4, in: filterFormat)])
                    publisher = results.filter(filterFormat).sorted(byKeyPath: sort, ascending: false).collectionPublisher
                } else {
                    publisher = results.sorted(byKeyPath: sort, ascending: false).collectionPublisher
                }
                return publisher.eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }

    func categorizers<T: PaperCategorizer>(categorizerType: T.Type) -> AnyPublisher<Results<T>, Error> {
        return realmPublisher
            .flatMap { realm -> AnyPublisher<Results<T>, Error> in
                if let realm = realm {
                    return realm.objects(T.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.eraseToAnyPublisher()
                } else {
                    self.logger.notice("[DB] Realm nil (categorizers): \(String(describing: DBError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: Error.self).eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }

    // MARK: - Function for Categorizer
    func link<T: PaperCategorizer>(categorizerStrs: String, realm: Realm) -> [T] {
        var categorizers: [T] = .init()
        let categorizerNameList = Array(Set(categorizerStrs.components(separatedBy: ";")))
        do {
            try realm.safeWrite {
                categorizerNameList.forEach { categorizerName in
                    let categorizerName = formatString(categorizerName, returnEmpty: true, trimWhite: true)!
                    if !categorizerName.isEmpty {
                        let existCategorizers = realm.objects(T.self).filter("name == \"\(categorizerName)\"")
                        if existCategorizers.count > 0 {
                            let categorizer = existCategorizers.first!
                            categorizer.count += 1
                            categorizers.append(categorizer)
                        } else {
                            let categorizer = T.init(name: categorizerName)
                            categorizer.count += 1
                            if self.cloudConfig != nil {
                                categorizer._partition = self.app!.currentUser?.id.description
                            }
                            realm.add(categorizer)
                            categorizers.append(categorizer)
                        }
                    }
                }
            }
        } catch let error {
            self.logger.error("[DB] Cannot link categorizer. \(String(describing: error))")
        }

        return categorizers
    }

    func unlink<T: PaperCategorizer>(categorizers: List<T>, realm: Realm) {
        // TODO: Not safe here.
        do {
            try realm.safeWrite {
                categorizers.forEach { categorizer in
                    categorizer.count -= 1
                    if categorizer.count <= 0 {
                        realm.delete(categorizer)
                    }
                }
            }
        } catch let error {
            self.logger.error("[DB] Cannot unlink categorizers. \(String(describing: error))")
        }
    }

    // MARK: - Delete
    func delete(ids: [ObjectId]) -> AnyPublisher<[String], DBError> {
        return realmPublisher
            .flatMap { realm -> AnyPublisher<[String], DBError> in
                if let realm = realm {
                    var removeFileURLs: [String] = .init()
                    let entities = realm.objects(PaperEntity.self).filter("_id IN %@", ids)

                    do {
                        try realm.safeWrite {
                            entities.forEach { entity in
                                removeFileURLs.append(entity.mainURL)
                                removeFileURLs.append(contentsOf: entity.supURLs)

                                self.unlink(categorizers: entity.tags, realm: realm)
                                self.unlink(categorizers: entity.folders, realm: realm)
                            }

                            realm.delete(entities)
                        }
                    } catch let err {
                        self.logger.error("Cannot delete entities. \(String(describing: err))")
                        return Fail(error: DBError.deleteError(error: err)).eraseToAnyPublisher()
                    }
                    return Just<[String]>
                        .withErrorType(removeFileURLs, DBError.self)
                        .eraseToAnyPublisher()
                } else {
                    self.logger.notice("[DB] Realm nil (delete entities): \(String(describing: DBError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: DBError.self).eraseToAnyPublisher()
                }
            }.eraseToAnyPublisher()
    }

    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type?) -> AnyPublisher<Bool, DBError> {
        return realmPublisher
            .flatMap { realm -> AnyPublisher<Bool, DBError> in
                if let realm = realm {
                    let categorizers = realm.objects(T.self).filter("name == \"\(categorizerName)\"")
                    do {
                        try realm.safeWrite {
                            categorizers.forEach { tagObj in
                                realm.delete(tagObj)
                            }
                        }
                    } catch let err {
                        self.logger.error("Cannot delete categorizers. \(String(describing: err))")
                        return Fail(error: DBError.deleteError(error: err)).eraseToAnyPublisher()
                    }
                    return Just<Bool>
                        .withErrorType(true, DBError.self)
                        .eraseToAnyPublisher()
                } else {
                    self.logger.notice("[DB] Realm nil (delete categorizers): \(String(describing: DBError.realmNilError))")
                    return Empty(completeImmediately: false).setFailureType(to: DBError.self).eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }

    // MARK: - Update
    func build(entityDraft: PaperEntityDraft, realm: Realm) -> PaperEntity {
        let entity = PaperEntity()

        entity._id = entityDraft.id
        entity.id = entityDraft.id
        entity.addTime = entityDraft.addTime

        entity.title = entityDraft.title
        entity.title = entity.title.isEmpty ? "untitled" : entity.title
        entity.authors = entityDraft.authors
        entity.authors = entity.authors.isEmpty ? "none" : entity.authors
        entity.publication = entityDraft.publication
        entity.pubTime = entityDraft.pubTime
        entity.pubType = ["Journal", "Conference", "Others"].firstIndex(of: entityDraft.pubType) ?? 2
        entity.doi = entityDraft.doi
        entity.arxiv = entityDraft.arxiv
        entity.mainURL = entityDraft.mainURL
        entity.supURLs = List()
        entityDraft.supURLs.forEach({supURL in entity.supURLs.append(supURL)})
        entity.rating = entityDraft.rating
        entity.flag = entityDraft.flag
        entity.note = entityDraft.note

        // add new tags
        let tags: [PaperTag] = self.link(categorizerStrs: formatString(entityDraft.tags, removeWhite: true)!, realm: realm)
        entity.tags = List<PaperTag>()
        tags.forEach { tag in
            entity.tags.append(tag)
        }
        // add new folders
        let folders: [PaperFolder] = self.link(categorizerStrs: formatString(entityDraft.folders, removeWhite: true)!, realm: realm)
        entity.folders = List<PaperFolder>()
        folders.forEach { folder in
            entity.folders.append(folder)
        }

        if self.cloudConfig != nil {
            entity._partition = self.app!.currentUser?.id.description
        }
        return entity
    }

    func update(from entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], DBError> {
        return realmPublisher
            .flatMap { realm -> AnyPublisher<[Bool], DBError> in
                var successes: [Bool] = .init()
                if let realm = realm {
                    do {
                        try realm.safeWrite {
                            entities.forEach { entity in
                                if let updateObj = realm.object(ofType: PaperEntity.self, forPrimaryKey: entity.id) {
                                    if self.cloudConfig != nil {
                                        updateObj._partition = self.app!.currentUser?.id.description
                                    }

                                    updateObj.title = entity.title
                                    updateObj.authors = entity.authors
                                    updateObj.publication = entity.publication
                                    updateObj.pubTime = entity.pubTime
                                    updateObj.pubType = ["Journal", "Conference", "Others"].firstIndex(of: entity.pubType) ?? 2
                                    updateObj.doi = entity.doi
                                    updateObj.arxiv = entity.arxiv
                                    updateObj.mainURL = entity.mainURL
                                    updateObj.supURLs = List()
                                    entity.supURLs.forEach { url in
                                        updateObj.supURLs.append(url)
                                    }
                                    updateObj.rating = entity.rating
                                    updateObj.flag = entity.flag

                                    // remove old tags
                                    self.unlink(categorizers: updateObj.tags, realm: realm)
                                    updateObj.tags.removeAll()
                                    // add new tags
                                    let tags: [PaperTag] = self.link(categorizerStrs: formatString(entity.tags, removeWhite: true)!, realm: realm)
                                    tags.forEach { tag in
                                        updateObj.tags.append(tag)
                                    }

                                    // remove old folders
                                    self.unlink(categorizers: updateObj.folders, realm: realm)
                                    updateObj.folders.removeAll()
                                    // add new folders
                                    let folders: [PaperFolder] = self.link(categorizerStrs: formatString(entity.folders, removeWhite: true)!, realm: realm)
                                    folders.forEach { folder in
                                        updateObj.folders.append(folder)
                                    }

                                    updateObj.note = entity.note
                                    successes.append(true)
                                } else {
                                    let existingObjs = realm.objects(PaperEntity.self).filter("title == \"\(entity.title)\" and authors == \"\(entity.authors)\"")
                                    if existingObjs.count > 0 {
                                        self.logger.info("[DB] Paper Existing: \(entity.title)")
                                        successes.append(false)
                                    } else {
                                        let newObj = self.build(entityDraft: entity, realm: realm)
                                        realm.add(newObj)
                                        successes.append(true)
                                    }
                                }
                            }
                        }
                    } catch let error {
                        self.logger.error("[DB] Cannot update db. \(String(describing: error))")
                        return Fail(error: DBError.updateError(error: error)).eraseToAnyPublisher()
                    }
                } else {
                    return Fail(error: DBError.realmNilError).eraseToAnyPublisher()
                }

                return Just<[Bool]>
                    .withErrorType(successes, DBError.self)
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
}
