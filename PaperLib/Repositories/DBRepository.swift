//
//  DBRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import CoreData
import Combine
import RealmSwift


protocol DBRepository {
    func entities(search: String?, flag: Bool, tags: Array<String>, folders: Array<String>, freeze: Bool) -> AnyPublisher<Results<PaperEntity>, Error>
    func entity(id: ObjectId, freeze: Bool) -> AnyPublisher<PaperEntity, Never>
    func entities(ids: Set<ObjectId>, freeze: Bool) -> AnyPublisher<Results<PaperEntity>, Error>
    
    func tags() -> AnyPublisher<Results<PaperTag>, Error>
    func folders() -> AnyPublisher<Results<PaperFolder>, Error>
    
    func add(for entity: PaperEntity?) -> AnyPublisher<Bool, Error>
    
    func delete(entities: Results<PaperEntity>) -> AnyPublisher<Bool, Error>
    
    func delete(tags: List<PaperTag>)
    func delete(folders: List<PaperFolder>)
    
    func update(entity: EditPaperEntity, method: String) -> AnyPublisher<Bool, Error>
    func update(entities: [EditPaperEntity], method: String, editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error>
    func update(entities: [PaperEntity], method: String, editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error>
    func update(entities: Results<PaperEntity>, method: String, editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error>

    func copy(entity: PaperEntity) -> AnyPublisher<PaperEntity, Error>
    func copy(entities: [PaperEntity]) -> AnyPublisher<[PaperEntity], Error>
    
    func rate(id: ObjectId, value: Int)
    func demoEntities() -> Array<PaperEntity>
}

extension Realm {
    public func safeWrite(_ block: (() throws -> Void)) throws {
        if isInWriteTransaction {
            try block()
        } else {
            try write(block)
        }
    }
}

struct RealDBRepository: DBRepository {
   
    // MARK: - Select
    func entities(search: String?, flag: Bool, tags: Array<String>, folders: Array<String>, freeze: Bool=true) -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! Realm()
        
        var filterFormat = ""
        if (search != nil) {
            if (!search!.isEmpty) {
                filterFormat += "(title contains[cd] '\(formatString(search)!)' OR authors contains[cd] '\(formatString(search)!)' OR publication contains[cd] '\(formatString(search)!)') AND "
            }
        }
        if (flag) {
            filterFormat += "(flag == true) AND "
        }
        tags.forEach { tag in
            filterFormat += "(ANY tags.id == '\(tag)') AND "
        }
        folders.forEach { folder in
            filterFormat += "(ANY folders.id == '\(folder)') AND "
        }
        
        var publisher: RealmPublishers.Value<Results<PaperEntity>>
        if (!filterFormat.isEmpty) {
            filterFormat = String(filterFormat[..<String.Index(utf16Offset: (filterFormat.count - 4), in: filterFormat)])
            publisher = realm.objects(PaperEntity.self).filter(filterFormat).sorted(byKeyPath: "addTime", ascending: false).collectionPublisher
        }
        else {
            publisher = realm.objects(PaperEntity.self).sorted(byKeyPath: "addTime", ascending: false).collectionPublisher
        }
        
        if (freeze) {
            return publisher.freeze().eraseToAnyPublisher()
        }
        else{
            return publisher.eraseToAnyPublisher()
        }
    }
    
    func entities(ids: Set<ObjectId>, freeze: Bool=true) -> AnyPublisher<Results<PaperEntity>, Error> {
        let realm = try! Realm()
        
        var publisher: RealmPublishers.Value<Results<PaperEntity>>
        publisher = realm.objects(PaperEntity.self).filter("id IN %@", ids).collectionPublisher
        if (freeze) {
            return publisher.freeze().eraseToAnyPublisher()
        }
        else{
            return publisher.eraseToAnyPublisher()
        }
    }
    
    func entity(id: ObjectId, freeze: Bool=true) -> AnyPublisher<PaperEntity, Never> {
        let realm = try! Realm()
        var publisher: Optional<PaperEntity>.Publisher
        publisher = realm.object(ofType: PaperEntity.self, forPrimaryKey: id).publisher
        if (freeze) {
            return publisher.freeze().eraseToAnyPublisher()
        }
        else{
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
            if (entity == nil) { promise(.success(false)) }
            else {
                let realm = try! Realm()
                let existEntities = realm.objects(PaperEntity.self).filter("title == '\(entity!.title)' and authors == '\(entity!.authors)'")
                
                if (existEntities.count > 0) {
                    print("Paper exists.")
                    promise(.success(false))
                }
                else {
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
                if (tagObj.count <= 0) {
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
                if (folderObj.count <= 0) {
                    realm.delete(folderObj)
                }
            }
        }
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
            promise(.success(entities.map{PaperEntity(value: $0)}))
        }
        .eraseToAnyPublisher()
    }
    
    func update(entity: EditPaperEntity, method: String = "update") -> AnyPublisher<Bool, Error> {
        if (method == "flag") {
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
                        if (tagObj.count <= 0) {
                            realm.delete(tagObj)
                        }
                    }
                }
                updateObj.tags.removeAll()
                // add new tags
                entity.tags.components(separatedBy: "; ").forEach { tag in
                    let tagStr = formatString(tag, returnEmpty: true, trimWhite: true)!
                    if (!tagStr.isEmpty) {
                        let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: "tag-"+tagStr)
                        if (tagObj != nil) {
                            tagObj!.count += 1
                            updateObj.tags.append(tagObj!)
                        }
                        else {
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
                        if (folderObj.count <= 0) {
                            realm.delete(folderObj)
                        }
                    }
                }
                updateObj.folders.removeAll()
                // add new folders
                entity.folders.components(separatedBy: "; ").forEach { folder in
                    let folderStr = formatString(folder, returnEmpty: true, trimWhite: true)!
                    if (!folderStr.isEmpty) {
                        var folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: "folder-"+folderStr)
                        if (folderObj != nil) {
                            folderObj!.count += 1
                        }
                        else {
                            folderObj = PaperFolder(id: folderStr)
                            realm.add(folderObj!)
                        }
                        updateObj.folders.append(folderObj!)
                    }
                }
            }
            promise(.success(true))
        }
        .eraseToAnyPublisher()
    }
    
    func update(entities: [EditPaperEntity], method: String = "update", editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error> {
        
        var publishers: Array<AnyPublisher<Bool, Error>> = .init()
        
        if (editedEntities == nil){
            entities.forEach { entity in
                publishers.append(update(entity: entity, method: method))
            }
        }
        else {
            editedEntities!.forEach { entity in
                publishers.append(update(entity: entity, method: method))
            }
        }
        return Publishers.MergeMany(publishers)
            .collect()
            .eraseToAnyPublisher()
    }
    
    func update(entities: [PaperEntity], method: String = "update", editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error> {
        return update(entities: entities.map{EditPaperEntity(from: $0)}, method: method, editedEntities: editedEntities)
    }
    
    func update(entities: Results<PaperEntity>, method: String = "update", editedEntities: Array<EditPaperEntity>?) -> AnyPublisher<[Bool], Error> {
        return update(entities: Array(entities), method: method, editedEntities: editedEntities)
    }
    

    func rate(id: ObjectId, value: Int) {
        let realm = try! Realm()
        let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
        try! realm.safeWrite {
            entity.rating = value
        }
    }
    
    
    func demoEntities() -> Array<PaperEntity> {
        var entities: Array<PaperEntity> = .init()
        
        for i in 1...2 {
            entities.append(
                PaperEntity(
                    title: "Title \(i)",
                    authors: "Author \(i)",
                    publication: "Publication \(i)",
                    pubTime: "2021",
                    pubType: 0,
                    doi: nil,
                    arxiv: nil,
                    mainURL: nil,
                    supURLs: nil,
                    rating: nil,
                    addTime: nil,
                    flag: false
                ))
        }
        
        return entities
    }
}
