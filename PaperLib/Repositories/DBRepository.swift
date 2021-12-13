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
    func setDBPath(path: String?) -> AnyPublisher<Bool, Error>
    func moveDB(to path: String) -> AnyPublisher<Bool, Error>

    func entities(freeze: Bool) -> AnyPublisher<Results<PaperEntity>, Error>
    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String, freeze: Bool) -> AnyPublisher<Results<PaperEntity>, Error>
    func entity(id: ObjectId, freeze: Bool) -> AnyPublisher<PaperEntity, Never>
    func entities(ids: Set<ObjectId>, freeze: Bool) -> AnyPublisher<Results<PaperEntity>, Error>

    func tags() -> AnyPublisher<Results<PaperTag>, Error>
    func folders() -> AnyPublisher<Results<PaperFolder>, Error>

    func add(for entity: PaperEntity?) -> AnyPublisher<Bool, Error>

    func delete(entities: Results<PaperEntity>) -> AnyPublisher<Bool, Error>

    func delete(tags: List<PaperTag>)
    func delete(folders: List<PaperFolder>)
    func delete(tagId: String) -> AnyPublisher<Bool, Error>
    func delete(folderId: String) -> AnyPublisher<Bool, Error>

    func update(entity: EditPaperEntity, method: String) -> AnyPublisher<Bool, Error>
    func update(entities: [EditPaperEntity], method: String, editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error>
    func update(entities: [PaperEntity], method: String, editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error>
    func update(entities: Results<PaperEntity>, method: String, editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error>

    func copy(entity: PaperEntity) -> AnyPublisher<PaperEntity, Error>
    func copy(entities: [PaperEntity]) -> AnyPublisher<[PaperEntity], Error>

    func rate(id: ObjectId, value: Int)
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

struct RealDBRepository: DBRepository {
    init() {
        setDBPath(path: UserDefaults.standard.string(forKey: "appLibFolder"))
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
    }

    func setDBPath(path: String?) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            
            var config = Realm.Configuration(
                // Set the new schema version. This must be greater than the previously used
                // version (if you've never set a schema version before, the version is 0).
                schemaVersion: 1,

                // Set the block which will be called automatically when opening a Realm with
                // a schema version lower than the one set above
                migrationBlock: { migration, oldSchemaVersion in
                    // We haven’t migrated anything yet, so oldSchemaVersion == 0
                    if (oldSchemaVersion < 1) {
                        // Nothing to do!
                        // Realm will automatically detect new properties and removed properties
                        // And will update the schema on disk automatically
                    }
                })

            var url: URL?
            if path != nil {
                if !path!.isEmpty {
                    url = URL(string: path!)
                }
            } else {
                let docPaths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
                let documentsDirectory = docPaths[0]
                url = documentsDirectory.appendingPathComponent("paperlib")
            }

            if let applicationSupportURL = url {
                do {
                    try FileManager.default.createDirectory(at: applicationSupportURL, withIntermediateDirectories: true, attributes: nil)
                    config.fileURL = applicationSupportURL.appendingPathComponent("default.realm")
                } catch let err {
                    print(err)
                }
            }

            
            
            
            // Set this as the configuration used for the default Realm
            Realm.Configuration.defaultConfiguration = config

            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    func moveDB(to path: String) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            var fromURL = Realm.Configuration.defaultConfiguration.fileURL!
            let toURL = URL(string: path)

            if let toURL = toURL {
                fromURL = fromURL.deletingLastPathComponent()

                let dbNames = ["default.realm", "default.realm.lock", "default.realm.management"]

                dbNames.forEach { dbName in
                    do {
                        try FileManager.default.moveItem(at: fromURL.appendingPathComponent(dbName), to: toURL.appendingPathComponent(dbName))
                    } catch let err {
                        print(err)
                    }
                }
            }

            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Select

    func entities(freeze: Bool = true) -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! Realm()

        var publisher: RealmPublishers.Value<Results<PaperEntity>>

        publisher = realm.objects(PaperEntity.self).collectionPublisher

        if freeze {
            return publisher.freeze().eraseToAnyPublisher()
        } else {
            return publisher.eraseToAnyPublisher()
        }
    }

    func entities(search: String?, flag: Bool, tags: [String], folders: [String], sort: String, freeze: Bool = true) -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! Realm()

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

    func entities(ids: Set<ObjectId>, freeze: Bool = true) -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! Realm()

        var publisher: RealmPublishers.Value<Results<PaperEntity>>
        publisher = realm.objects(PaperEntity.self).filter("id IN %@", ids).collectionPublisher
        if freeze {
            return publisher.freeze().eraseToAnyPublisher()
        } else {
            return publisher.eraseToAnyPublisher()
        }
    }

    func entity(id: ObjectId, freeze: Bool = true) -> AnyPublisher<PaperEntity, Never> {
        let realm = try! Realm()
        var publisher: Optional<PaperEntity>.Publisher
        publisher = realm.object(ofType: PaperEntity.self, forPrimaryKey: id).publisher
        if freeze {
            return publisher.freeze().eraseToAnyPublisher()
        } else {
            return publisher.eraseToAnyPublisher()
        }
    }

    func tags() -> AnyPublisher<Results<PaperTag>, Error> {
        let realm = try! Realm()
        return realm.objects(PaperTag.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.freeze().eraseToAnyPublisher()
    }

    func folders() -> AnyPublisher<Results<PaperFolder>, Error> {
        let realm = try! Realm()
        return realm.objects(PaperFolder.self).sorted(byKeyPath: "name", ascending: true).collectionPublisher.freeze().eraseToAnyPublisher()
    }

    // MARK: - Add

    func add(for entity: PaperEntity?) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            if entity == nil { promise(.success(false)) }
            else {
                let realm = try! Realm()
                let existEntities = realm.objects(PaperEntity.self).filter("title == \"\(entity!.title)\" and authors == \"\(entity!.authors)\"")

                if (existEntities.count > 0 && !entity!.title.isEmpty && !entity!.authors.isEmpty) {
                    print("Paper exists.")
                    promise(.success(false))
                } else {
                    
                    if entity!.title.isEmpty {
                        entity!.title = "untitled"
                    }
                    if entity!.authors.isEmpty {
                        entity!.authors = "none"
                    }
                    
                    try! realm.safeWrite {
                        realm.add(entity!)
                    }
                    promise(.success(true))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Delete

    func delete(entities: Results<PaperEntity>) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            let realm = try! Realm()
            try! realm.safeWrite {
                entities.forEach { entity in
                    let _entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: entity.id)!
                    delete(tags: _entity.tags)
                    delete(folders: _entity.folders)
                    realm.delete(_entity)
                }
            }
            promise(.success(true))
        }.eraseToAnyPublisher()
    }

    func delete(tags: List<PaperTag>) {
        let realm = try! Realm()
        tags.forEach { tag in
            let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: tag.id)!
            try! realm.safeWrite {
                tagObj.count -= 1
                if tagObj.count <= 0 {
                    realm.delete(tagObj)
                }
            }
        }
    }

    func delete(folders: List<PaperFolder>) {
        let realm = try! Realm()
        folders.forEach { folder in
            let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: folder.id)!
            try! realm.safeWrite {
                folderObj.count -= 1
                if folderObj.count <= 0 {
                    realm.delete(folderObj)
                }
            }
        }
    }

    func delete(tagId: String) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            let realm = try! Realm()
            let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: tagId)!
            try! realm.safeWrite {
                realm.delete(tagObj)
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    func delete(folderId: String) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            let realm = try! Realm()
            let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: folderId)!
            try! realm.safeWrite {
                realm.delete(folderObj)
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Update

    func copy(entity: PaperEntity) -> AnyPublisher<PaperEntity, Error> {
        return Future<PaperEntity, Error> { promise in
            promise(.success(PaperEntity(value: entity)))
        }
        .eraseToAnyPublisher()
    }

    func copy(entities: [PaperEntity]) -> AnyPublisher<[PaperEntity], Error> {
        return Future<[PaperEntity], Error> { promise in
            promise(.success(entities.map { PaperEntity(value: $0) }))
        }
        .eraseToAnyPublisher()
    }

    func update(entity: EditPaperEntity, method: String = "update") -> AnyPublisher<Bool, Error> {
        if method == "flag" {
            entity.flag.toggle()
        }

        return Future<Bool, Error> { promise in
            let realm = try! Realm()
            let updateObj = realm.object(ofType: PaperEntity.self, forPrimaryKey: entity.id)!

            try! realm.safeWrite {
                updateObj.title = entity.title
                updateObj.authors = entity.authors
                updateObj.publication = entity.publication
                updateObj.pubTime = entity.pubTime
                updateObj.pubType = ["Journal", "Conference", "Others"].firstIndex(of: entity.pubType)
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
                updateObj.tags.forEach { tag in
                    if let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: tag.id) {
                        tagObj.count -= 1
                        if tagObj.count <= 0 {
                            realm.delete(tagObj)
                        }
                    }
                }
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
                updateObj.folders.forEach { folder in
                    if let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: folder.id) {
                        folderObj.count -= 1
                        if folderObj.count <= 0 {
                            realm.delete(folderObj)
                        }
                    }
                }
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
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }

    func update(entities: [EditPaperEntity], method: String = "update", editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error> {
        var publishers: [AnyPublisher<Bool, Error>] = .init()

        if editedEntities == nil {
            entities.forEach { entity in
                publishers.append(update(entity: entity, method: method))
            }
        } else {
            editedEntities!.forEach { entity in
                publishers.append(update(entity: entity, method: method))
            }
        }
        return Publishers.MergeMany(publishers)
            .collect()
            .eraseToAnyPublisher()
    }

    func update(entities: [PaperEntity], method: String = "update", editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error> {
        return update(entities: entities.map { EditPaperEntity(from: $0) }, method: method, editedEntities: editedEntities)
    }

    func update(entities: Results<PaperEntity>, method: String = "update", editedEntities: [EditPaperEntity]?) -> AnyPublisher<[Bool], Error> {
        return update(entities: Array(entities), method: method, editedEntities: editedEntities)
    }

    func rate(id: ObjectId, value: Int) {
        let realm = try! Realm()
        let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
        try! realm.safeWrite {
            entity.rating = value
        }
    }
}
