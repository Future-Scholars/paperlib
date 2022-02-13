//
//  DBRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import CoreData
import RealmSwift

protocol DBRepository {
    func getConfig() async -> Realm.Configuration
    func getConfig(settings: AppState.Setting) async -> Realm.Configuration
    func getLocalConfig() -> Realm.Configuration
    func getCloudConfig() async -> Realm.Configuration
    func migrate(migration: Migration, oldSchemaVersion: UInt64)
    func migrateLocaltoCloud()

    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String) async -> AnyPublisher<Results<PaperEntity>, Error>
    func preprintEntities() async -> Results<PaperEntity>

    func tags() async -> AnyPublisher<Results<PaperTag>, Error>
    func folders() async -> AnyPublisher<Results<PaperFolder>, Error>

    func add(for entities: [PaperEntityDraft]) async -> AnyPublisher<[String], Error>

    func delete(ids: [ObjectId]) async -> AnyPublisher<[String], Error>
    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type?) async -> AnyPublisher<Bool, Error>

    func update(from entities: [PaperEntityDraft]) async -> AnyPublisher<Bool, Error>

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

class RealDBRepository: DBRepository {
    var realmSchemaVersion: UInt64 = 5
    var cloudConfig: Realm.Configuration?
    var localConfig: Realm.Configuration?
    var app: App?
    var inited: Bool

    init() {
        self.inited = false
        _ = Task {
            _ = await getConfig()
            self.inited = true
        }

    }

    func getConfig() async -> Realm.Configuration {
        if UserDefaults.standard.bool(forKey: "useSync") && !(UserDefaults.standard.string(forKey: "syncAPIKey") ?? "").isEmpty {
            return await getCloudConfig()
        } else {
            self.cloudConfig = nil
            return getLocalConfig()
        }
    }

    func getConfig(settings: AppState.Setting) async -> Realm.Configuration {
        await self.logoutSync()
        if settings.useSync && !settings.syncAPIKey.isEmpty {
            return await getCloudConfig()
        } else {
            self.cloudConfig = nil
            return getLocalConfig()
        }
    }

    func getLocalConfig() -> Realm.Configuration {
        print("Opening local db...")
        let pathStr = UserDefaults.standard.string(forKey: "appLibFolder")

        var config = Realm.Configuration(
            schemaVersion: self.realmSchemaVersion,
            migrationBlock: self.migrate
        )

        let pathURL = URL(string: pathStr ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("paperlib").absoluteString)
        if let pathURL = pathURL {
            do {
                try FileManager.default.createDirectory(at: pathURL, withIntermediateDirectories: true, attributes: nil)
                config.fileURL = pathURL.appendingPathComponent("default.realm")
                UserDefaults.standard.set(pathURL.absoluteString, forKey: "appLibFolder")
            } catch let err {
                print(err)
            }
        } else {
            print("Cannot set custom path \(String(describing: pathStr)) for local database.")
        }

        self.localConfig = config
        return config
    }

    func getCloudConfig() async -> Realm.Configuration {
        print("Opening sync db...")

        if let cloudUser = await self.loginCloud() {
            self.app!.syncManager.errorHandler = { error, _ in
                print(error)
            }

            let partitionValue = cloudUser.id
            var config = cloudUser.configuration(
                partitionValue: partitionValue
            )
            config.schemaVersion = self.realmSchemaVersion
            config.migrationBlock = self.migrate

            self.cloudConfig = config
            return config
        } else {
            print("Cannot login to sync db.")
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
        } catch let err {
            print("Cannot login to sync db. \(String(describing: err))")
            return nil
        }
    }

    func logoutSync() async {
        if self.app == nil {
            self.app = App(id: "paperlib-iadbj")
        }
        do {
            try await self.app!.currentUser?.logOut()
        } catch let err {
            print("Cannot logout from sync db. \(String(describing: err))")
        }
    }

    func migrate(migration: Migration, oldSchemaVersion: UInt64) {
        print("Dataset Version: \(oldSchemaVersion)")
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

                _ = await self.update(from: entityDrafts)
            } catch let error {
                print(error)
            }
        }
    }

    func realm() async -> Realm {
        if !self.inited {
            _ = await self.getConfig()
            self.inited = true
        }

        // swiftlint:disable force_try
        if self.cloudConfig == nil {
            return try! await Realm(configuration: self.localConfig!)
        } else {
            do {
                return try await Realm(configuration: self.cloudConfig!, downloadBeforeOpen: .always)
            } catch let err {
                print("Cannot open cloud database. \(String(describing: err))")
                self.localConfig = self.getLocalConfig()
                return try! await Realm(configuration: self.localConfig!)
            }
        }
        // swiftlint:enable force_try
    }

    // MARK: - Select
    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String) async -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = await self.realm()

        var filterFormat = ""
        if search != nil {
            if !search!.isEmpty {
                filterFormat += "(title contains[cd] \"\(formatString(search)!)\" OR authors contains[cd] \"\(formatString(search)!)\" OR publication contains[cd] \"\(formatString(search)!)\" OR note contains[cd] \"\(formatString(search)!)\") AND "
            }
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
        if !filterFormat.isEmpty {
            filterFormat = String(filterFormat[..<String.Index(utf16Offset: filterFormat.count - 4, in: filterFormat)])
            publisher = realm.objects(PaperEntity.self).filter(filterFormat).sorted(byKeyPath: sort, ascending: false).collectionPublisher
        } else {
            publisher = realm.objects(PaperEntity.self).sorted(byKeyPath: sort, ascending: false).collectionPublisher
        }
        return publisher.eraseToAnyPublisher()
    }

    func preprintEntities() async -> Results<PaperEntity> {
        let realm = await self.realm()

        let filterFormat = "publication contains[cd] \"arXiv\""
        return realm.objects(PaperEntity.self).filter(filterFormat)
    }

    func tags() async -> AnyPublisher<Results<PaperTag>, Error> {
        let realm = await self.realm()
        return realm.objects(PaperTag.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.eraseToAnyPublisher()
    }

    func folders() async -> AnyPublisher<Results<PaperFolder>, Error> {
        let realm = await self.realm()
        return realm.objects(PaperFolder.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.eraseToAnyPublisher()
    }

    // MARK: - Construct from Draft
    func build(entitiesDraft: [PaperEntityDraft?]) async -> [PaperEntity?] {

        let realm = await self.realm()

        var readyEntities: [PaperEntity?] = .init()

        entitiesDraft.forEach({
            if let entityDraft = $0 {
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

                entity.tags = List<PaperTag>()
                formatString(entityDraft.tags, removeWhite: true)!
                    .components(separatedBy: ";")
                    .forEach({tagStr in
                        guard !tagStr.isEmpty else { return }
                        let existTags = realm.objects(PaperTag.self).filter("ANY tags.name == \"\(tagStr)\"")
                        let tagObj = existTags.count > 0 ? existTags.first! : PaperTag(name: tagStr)

                        tagObj.count += 1

                        if self.cloudConfig != nil {
                            tagObj._partition = self.app!.currentUser?.id.description
                        }

                        entity.tags.append(tagObj)
                    })
                entity.folders = List<PaperFolder>()
                formatString(entityDraft.folders, removeWhite: true)!
                    .components(separatedBy: ";")
                    .forEach({folderStr in
                        guard !folderStr.isEmpty else { return }
                        let existFolders = realm.objects(PaperFolder.self).filter("ANY folders.name == \"\(folderStr)\"")
                        let folderObj = existFolders.count > 0 ? existFolders.first! : PaperFolder(name: folderStr)

                        folderObj.count += 1

                        if self.cloudConfig != nil {
                            folderObj._partition = self.app!.currentUser?.id.description
                        }

                        entity.folders.append(folderObj)
                    })

                if self.cloudConfig != nil {
                    entity._partition = self.app!.currentUser?.id.description
                }

                readyEntities.append(entity)
            } else {
                readyEntities.append(nil)
            }

        })

        return readyEntities
    }

    // MARK: - Add

    func add(for entities: [PaperEntityDraft]) async -> AnyPublisher<[String], Error> {
        let realm = await self.realm()

        var failedPaths: [String] = .init()

        let prepareEntities: [PaperEntityDraft?] = entities.map({ entity in
            let existEntities = realm.objects(PaperEntity.self).filter("title == \"\(entity.title)\" and authors == \"\(entity.authors)\"")

            if existEntities.count > 0 && !entity.title.isEmpty && !entity.title.isEmpty {
                print("Paper exists: \(entity.title)")

                failedPaths.append(entity.mainURL)
                failedPaths.append(contentsOf: entity.supURLs)

                return nil
            } else {
                return entity
            }
        })

        let readyEntities = await self.build(entitiesDraft: prepareEntities)

        return Future<[String], Error> { promise in

            do {
                try realm.safeWrite {
                    readyEntities.forEach({
                        if let readyEntity = $0 {
                            realm.add(readyEntity)
                        }
                    })
                    promise(.success(failedPaths))
                }
            } catch let err {
                // TODO: To handle failed better.
                print("Cannot add to db. \(String(describing: err))")
                promise(.success(failedPaths))
            }
        }
        .eraseToAnyPublisher()
    }

    func link<T: PaperCategorizer>(categorizerStrs: String, realm: Realm) -> [T] {
        var categorizers: [T] = .init()
        let categorizerNameList = categorizerStrs.components(separatedBy: ";")
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
        } catch let err {
            print("Cannot link categorizer. \(String(describing: err))")
        }

        return categorizers
    }

    // MARK: - Delete

    func delete(ids: [ObjectId]) async -> AnyPublisher<[String], Error> {
        let realm = await self.realm()

        return Future<[String], Error> { promise in

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
                promise(.success(removeFileURLs))
            } catch let err {
                print("Cannot delete entities. \(String(describing: err))")
                promise(.success(removeFileURLs))
            }
        }.eraseToAnyPublisher()
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
        } catch let err {
            print("Cannot unlink categorizers. \(String(describing: err))")
        }
    }

    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type?) async -> AnyPublisher<Bool, Error> {
        let realm = await self.realm()
        return Future<Bool, Error> { promise in
            let categorizers = realm.objects(T.self).filter("name == \"\(categorizerName)\"")
            do {
                try realm.safeWrite {
                    categorizers.forEach { tagObj in
                        realm.delete(tagObj)
                    }
                }
                promise(.success(true))
            } catch let err {
                print("Cannot delete categorizers. \(String(describing: err))")
                promise(.success(true))
            }
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Update

    func update(from entities: [PaperEntityDraft]) async -> AnyPublisher<Bool, Error> {
        let realm =  await self.realm()

        return Future<Bool, Error> { promise in
            var newObjs: [PaperEntityDraft] = .init()

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
                        } else {
                            newObjs.append(entity)
                        }
                    }
                }

                let newObjList = newObjs
                Task {
                    _ = await self.add(for: newObjList)
                    promise(.success(true))
                }
            } catch let err {
                print("Cannot update db. \(String(describing: err))")
                promise(.success(true))
            }
        }
        .eraseToAnyPublisher()
    }
}
