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
    func open() async -> Realm.Configuration
    func open(settings: AppState.Setting) async -> Realm.Configuration
    func openLocal() -> Realm.Configuration
    func openSync() async -> Realm.Configuration
    func migrate(migration: Migration, oldSchemaVersion: UInt64)
    
    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String, freeze: Bool) async -> AnyPublisher<Results<PaperEntity>, Error>
    func entities(ids: Set<ObjectId>, freeze: Bool) async -> AnyPublisher<Results<PaperEntity>, Error>

    func tags() async -> AnyPublisher<Results<PaperTag>, Error>
    func folders() async -> AnyPublisher<Results<PaperFolder>, Error>

    func add(for entities: [PaperEntityDraft]) async -> AnyPublisher<[String], Error>

    func delete(ids: [ObjectId]) async -> AnyPublisher<[String], Error>

    func unlink(tags: List<PaperTag>, realm: Realm?)
    func unlink(folders: List<PaperFolder>, realm: Realm?)
    func delete(tagId: String) async -> AnyPublisher<Bool, Error>
    func delete(folderId: String) async -> AnyPublisher<Bool, Error>

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
    var realmSchemaVersion: UInt64 = 4
    var syncConfig: Realm.Configuration?
    var localConfig: Realm.Configuration?
    var app: App?
    var inited: Bool
    
    init() {
        self.inited = false
        let _ = Task{
            let _ = await open()
            self.inited = true
        }
        
    }

    func open() async -> Realm.Configuration {
        if (UserDefaults.standard.bool(forKey: "useSync") && !(UserDefaults.standard.string(forKey: "syncAPIKey") ?? "").isEmpty ) {
            return await openSync()
        }
        else {
            return openLocal()
        }
    }
    
    func open(settings: AppState.Setting) async -> Realm.Configuration {
        if (settings.useSync && !settings.syncAPIKey.isEmpty ) {
            return await openSync()
        }
        else {
            return openLocal()
        }
    }
    
    func openLocal() -> Realm.Configuration {
        self.syncConfig = nil
        print("Opening local db...")
        let path = UserDefaults.standard.string(forKey: "appLibFolder")
        
        var config = Realm.Configuration(
            schemaVersion: self.realmSchemaVersion,
            migrationBlock: self.migrate)

        var url: URL?
        if (path != nil && !(path?.isEmpty ?? true)) {
            url = URL(string: path!)
        } else {
            let docPaths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
            let documentsDirectory = docPaths[0]
            url = documentsDirectory.appendingPathComponent("paperlib")
        }

        if let appLibURL = url {
            do {
                try FileManager.default.createDirectory(at: appLibURL, withIntermediateDirectories: true, attributes: nil)
                config.fileURL = appLibURL.appendingPathComponent("default.realm")
            } catch let err {
                print(err)
            }
        }
        self.localConfig = config
        
        return config
    }
    
    func openSync() async -> Realm.Configuration {
        print("Opening sync db...")
        do {
            let user = try await self.loginSync()
            self.app!.syncManager.errorHandler = { error, session in
                print(error)
            }
            
            let partitionValue = user.id
            var config = user.configuration(
                partitionValue: partitionValue
            )
            config.schemaVersion = self.realmSchemaVersion
            config.migrationBlock = self.migrate
            self.syncConfig = config
            
            return config
        }
        catch {
            print("Cannot login to sync db.")
            return self.openLocal()
        }
    }
    
    func loginSync() async throws -> User {
        if (self.app == nil) {
            self.app = App(id: "paperlib-iadbj")
        }
        
        if self.app!.currentUser != nil {
            return self.app!.currentUser!
        } else {
            self.app = App(id: "paperlib-iadbj")
            let credentials = Credentials.userAPIKey(UserDefaults.standard.string(forKey: "syncAPIKey")!)
            let loggedInUser = try await self.app!.login(credentials: credentials)
            return loggedInUser
        }
    }
    
    func migrate(migration: Migration, oldSchemaVersion: UInt64) {
        print("Dataset Version: \(oldSchemaVersion)")
        if (oldSchemaVersion < 2) {
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
                newObject!["mainURL"] = oldObject!["mainURL"] ?? ""
                newObject!["rating"] = oldObject!["rating"] ?? 0
                newObject!["flag"] = oldObject!["flag"] ?? false
            }
        }
            
        if (oldSchemaVersion < 3) {
            migration.enumerateObjects(ofType: PaperEntity.className()) { oldObject, newObject in

                newObject!["mainURL"] = URL(string: (newObject!["mainURL"] as! String))?.lastPathComponent ?? "";
                var newObjectSupURLs: Array<String> = .init();

                unsafeBitCast(newObject!["supURLs"] as! List<DynamicObject>, to: List<String>.self).forEach { supURL in
                    if let fileName = URL(string: supURL)?.lastPathComponent {
                        newObjectSupURLs.append(fileName);
                    }
                }
                newObject!["supURLs"] = newObjectSupURLs;
            }
        }
        
        if (oldSchemaVersion < 4) {
            migration.enumerateObjects(ofType: PaperEntity.className()) { oldObject, newObject in
                newObject!["_id"] = oldObject!["id"]
            }
            migration.enumerateObjects(ofType: PaperTag.className()) { oldObject, newObject in
                newObject!["_id"] = oldObject!["id"]
            }
            migration.enumerateObjects(ofType: PaperFolder.className()) { oldObject, newObject in
                newObject!["_id"] = oldObject!["id"]
            }
        }
    }

    func realm() async throws -> Realm {
        if (!self.inited) {
            let _ = await self.open()
            self.inited = true
        }
        
        if (syncConfig == nil) {
            let realm = try await Realm(configuration: self.localConfig!)
            return realm
        }
        else {
            do {
                let realm = try await Realm(configuration: self.syncConfig!, downloadBeforeOpen: .always)
                return realm
            }
            catch {
                print(error)
                self.syncConfig = nil
                UserDefaults.standard.set(false, forKey: "useSync")
                let _ = await self.open()
                let realm = try await Realm(configuration: self.localConfig!)
                return realm
            }
        }
    }
    
    
    // MARK: - Select
    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String, freeze: Bool = true) async -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! await self.realm()
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
                filterFormat += "(ANY tags.id == \"\(tag)\") AND "
            }
            folders.forEach { folder in
                filterFormat += "(ANY folders.id == \"\(folder)\") AND "
            }

            var publisher: RealmPublishers.Value<Results<PaperEntity>>
            if !filterFormat.isEmpty {
                filterFormat = String(filterFormat[..<String.Index(utf16Offset: filterFormat.count - 4, in: filterFormat)])
                publisher = realm.objects(PaperEntity.self).filter(filterFormat).sorted(byKeyPath: sort, ascending: false).collectionPublisher
            } else {
                publisher = realm.objects(PaperEntity.self).sorted(byKeyPath: sort, ascending: false).collectionPublisher
            }

            if freeze {
                return publisher.freeze().eraseToAnyPublisher()
            } else {
                return publisher.eraseToAnyPublisher()
            }
    }

    func entities(ids: Set<ObjectId>, freeze: Bool = true) async -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! await self.realm()

        var publisher: RealmPublishers.Value<Results<PaperEntity>>
        publisher = realm.objects(PaperEntity.self).filter("id IN %@", ids).collectionPublisher
        if freeze {
            return publisher.freeze().eraseToAnyPublisher()
        } else {
            return publisher.eraseToAnyPublisher()
        }
    }

    func tags() async -> AnyPublisher<Results<PaperTag>, Error> {
        let realm = try! await self.realm()
        return realm.objects(PaperTag.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.freeze().eraseToAnyPublisher()
    }

    func folders() async -> AnyPublisher<Results<PaperFolder>, Error> {
        let realm = try! await self.realm()
        return realm.objects(PaperFolder.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.freeze().eraseToAnyPublisher()
    }

    // MARK: - Construct from Draft
    func build(entitiesDraft: [PaperEntityDraft?]) async -> [PaperEntity?] {
        
        let realm = try! await self.realm()
        
        var readyEntities:[PaperEntity?] = .init()
        
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
                        let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: "tag-" + tagStr) ?? PaperTag(id: tagStr)
                        tagObj.count += 1
                        entity.tags.append(tagObj)
                    })
                entity.folders = List<PaperFolder>()
                formatString(entityDraft.folders, removeWhite: true)!
                    .components(separatedBy: ";")
                    .forEach({folderStr in
                        guard !folderStr.isEmpty else { return }
                        let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: "folder-" + folderStr) ?? PaperFolder(id: folderStr)
                        folderObj.count += 1
                        entity.folders.append(folderObj)
                    })
                
                if (self.syncConfig != nil){
                    entity._partition = self.app!.currentUser?.id.description
                }
                
                readyEntities.append(entity)
            }
            else {
                readyEntities.append(nil)
            }
            
        })
        
        return readyEntities
    }
    
    // MARK: - Add

    func add(for entities: [PaperEntityDraft]) async -> AnyPublisher<[String], Error> {
        let realm = try! await self.realm()
        
        var failedPaths: [String] = .init()
        
        let prepareEntities: [PaperEntityDraft?] = entities.map({ entity in
            let existEntities = realm.objects(PaperEntity.self).filter("title == \"\(entity.title)\" and authors == \"\(entity.authors))\"")
            
            if (existEntities.count > 0 && !entity.title.isEmpty && !entity.title.isEmpty) {
                print("Paper exists: \(entity.title)")
                
                failedPaths.append(entity.mainURL)
                failedPaths.append(contentsOf: entity.supURLs)
                
                return nil
            }
            else {
                return entity
            }
        })
        
        let readyEntities = await self.build(entitiesDraft: prepareEntities)

        return Future<[String], Error> { promise in

            try! realm.safeWrite {
                readyEntities.forEach({
                    if let readyEntity = $0 {
                        realm.add(readyEntity)
                    }
                })
            }
            promise(.success(failedPaths))
        }
        .eraseToAnyPublisher()
    }

    
    // MARK: - Delete

    func delete(ids: [ObjectId]) async -> AnyPublisher<[String], Error> {
        let realm = try! await self.realm()
        
        return Future<[String], Error> { promise in

            var removeFileURLs: [String] = .init()
            let entities = realm.objects(PaperEntity.self).filter("id IN %@", ids)
            
            try! realm.safeWrite {
                entities.forEach { entity in
                    removeFileURLs.append(entity.mainURL)
                    removeFileURLs.append(contentsOf: entity.supURLs)
                    
                    self.unlink(tags: entity.tags, realm: realm)
                    self.unlink(folders: entity.folders, realm: realm)
                    realm.delete(entity)
                }
            }
            promise(.success(removeFileURLs))
        }.eraseToAnyPublisher()
    }

    func unlink(tags: List<PaperTag>, realm: Realm? = nil) {
        let realm = realm != nil ? realm : try! Realm()
        tags.forEach { tag in
            print(tag.id)
            let tagObj = realm!.object(ofType: PaperTag.self, forPrimaryKey: tag.id)!
            try! realm!.safeWrite {
                tagObj.count -= 1
                if tagObj.count <= 0 {
                    realm!.delete(tagObj)
                }
            }
        }
    }

    func unlink(folders: List<PaperFolder>, realm: Realm? = nil) {
        let realm = realm != nil ? realm : try! Realm()
        folders.forEach { folder in
            let folderObj = realm!.object(ofType: PaperFolder.self, forPrimaryKey: folder.id)!
            try! realm!.safeWrite {
                folderObj.count -= 1
                if folderObj.count <= 0 {
                    realm!.delete(folderObj)
                }
            }
        }
    }

    func delete(tagId: String) async -> AnyPublisher<Bool, Error> {
        let realm = try! await self.realm()
        return Future<Bool, Error> { promise in
            if let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: tagId){
                try! realm.safeWrite {
                    realm.delete(tagObj)
                }
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    func delete(folderId: String) async -> AnyPublisher<Bool, Error> {
        let realm = try! await self.realm()
        return Future<Bool, Error> { promise in
            if let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: folderId){
                try! realm.safeWrite {
                    realm.delete(folderObj)
                }
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Update

    func update(from entities: [PaperEntityDraft]) async -> AnyPublisher<Bool, Error> {
        
        let realm =  try! await self.realm()
        
        return Future<Bool, Error> { promise in
            try! realm.safeWrite {
                entities.forEach { entity in
                
                    let updateObj = realm.object(ofType: PaperEntity.self, forPrimaryKey: entity.id)!

                    if (self.syncConfig != nil){
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
                    self.unlink(tags: updateObj.tags, realm: realm)
                    updateObj.tags.removeAll()
                    // add new tags
                    entity.tags = formatString(entity.tags, removeWhite: true)!
                    entity.tags.components(separatedBy: ";").forEach { tag in
                    let tagStr = formatString(tag, returnEmpty: true, trimWhite: true)!
                        if !tagStr.isEmpty {
                            let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: "tag-" + tagStr)
                            if tagObj != nil {
                                tagObj!.count += 1
                                updateObj.tags.append(tagObj!)
                            } else {
                                let newTagObj = PaperTag(id: tagStr)
                                realm.add(newTagObj)
                                updateObj.tags.append(newTagObj)
                            }
                        }
                    }

                    // remove old folders
                    self.unlink(folders: updateObj.folders, realm: realm)
                    updateObj.folders.removeAll()
                    // add new folders
                    entity.folders = formatString(entity.folders, removeWhite: true)!
                    entity.folders.components(separatedBy: ";").forEach { folder in
                        let folderStr = formatString(folder, returnEmpty: true, trimWhite: true)!
                        if !folderStr.isEmpty {
                            var folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: "folder-" + folderStr)
                            if folderObj != nil {
                                folderObj!.count += 1
                            } else {
                                folderObj = PaperFolder(id: folderStr)
                                realm.add(folderObj!)
                            }
                            updateObj.folders.append(folderObj!)
                        }
                    }

                    updateObj.note = entity.note
                }
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }
}
