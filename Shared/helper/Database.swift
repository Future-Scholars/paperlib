//
//  database.swift
//  PaperLib
//
//  Created by GeoffreyChen on 10/07/2021.
//

import Foundation
import RealmSwift


let pubTypeIdx = [0: "Journal", 1: "Conference", 2: "Others"]
let idxPubType = ["Journal": 0, "Conference": 1, "Others": 2]


class PaperEntity: Object, ObjectKeyIdentifiable {
    
    @Persisted var id: ObjectId
    @Persisted var addTime: Date
    
    
    @Persisted var title: String = ""
    @Persisted var authors: String = ""
    @Persisted var publication: String = ""
    @Persisted var pubTime: String = ""
    @Persisted var pubType: Int?   // 0: Article; 1: Conference; 2: Others
    @Persisted var doi: String?
    @Persisted var arxiv: String?
    @Persisted var mainURL: String?
    @Persisted var supURLs: List<String>
    @Persisted var rating: Int?
    @Persisted var tags: List<PaperTag>
    @Persisted var folders: List<PaperFolder>
    @Persisted var flag: Bool
    
    convenience init(
        title: String?,
        authors: String?,
        publication: String?,
        pubTime: String?,
        pubType: Int?,
        doi: String?,
        arxiv: String?,
        mainURL: String?,
        supURLs: Array<String>?,
        rating: Int?,
        addTime: Date?,
        flag: Bool?
    ) {
        self.init()
        
        self.id = ObjectId.generate()
        if (addTime != nil) {
            self.addTime = addTime!
        }
        else {
            self.addTime = Date()
        }
        
        self.title = title ?? ""
        self.authors = authors ?? ""
        self.publication = publication ?? ""
        self.pubTime = pubTime ?? ""
        self.pubType = pubType
        self.doi = doi
        self.arxiv = arxiv
        self.mainURL = mainURL
        supURLs?.forEach {supURL in
            self.supURLs.append(supURL)
        }
        self.rating = rating
        self.flag = flag != nil ? flag! : false
    }
    
    override static func primaryKey() -> String? {
        return "id"
    }
    
}

func deepcopyEntity(entity: PaperEntity) -> PaperEntity {
    let newEntity = PaperEntity()
    newEntity.id = entity.id
    newEntity.addTime = entity.addTime
    
    newEntity.rating = entity.rating
    newEntity.title = entity.title
    newEntity.authors = entity.authors
    newEntity.publication = entity.publication
    newEntity.pubTime = entity.pubTime
    newEntity.pubType = entity.pubType
    newEntity.doi = entity.doi
    newEntity.arxiv = entity.arxiv
    newEntity.mainURL = entity.mainURL
    newEntity.supURLs = entity.supURLs
    newEntity.rating = entity.rating
    newEntity.tags = entity.tags
    newEntity.folders = entity.folders
    newEntity.flag = entity.flag
    
    return newEntity
}

// ===========================================================================

class PaperTag: Object, ObjectKeyIdentifiable {
      
    @Persisted var id: String = ""
    @Persisted var count: Int = 1
    @Persisted var name: String = ""

    
    convenience init(id: String) {
        self.init()
        self.id = "tag-"+id
        self.name = id
    }
    
    override static func primaryKey() -> String {
        return "id"
    }
}

// ===========================================================================

class PaperFolder: Object, ObjectKeyIdentifiable {
      
    @Persisted var id: String = ""
    @Persisted var count: Int = 1
    @Persisted var name: String = ""

    
    convenience init(id: String) {
        self.init()
        self.id = "folder-"+id
        self.name = id
    }
    
    override static func primaryKey() -> String {
        return "id"
    }
}

struct PLDatabase {
    private var realm: Realm
    var dbFolder: String?
    
    init() {
        let dbFolder = UserDefaults.standard.string(forKey: "appLibFolder")
        self.dbFolder = dbFolder
        self.realm = try! Realm()
    }
    
    func insertEntity(entity: PaperEntity) -> PaperEntity? {
        
        let existEntities = realm.objects(PaperEntity.self).filter("title == '\(entity.title)' and authors == '\(entity.authors)'")
        if (existEntities.count > 0) {
            print("Paper exists.")
            return existEntities.first
        }
        
        try! realm.write {
            realm.add(entity)
            let mainURL = moveFile(entity: entity, sourcePath: entity.mainURL)
            entity.mainURL = mainURL
            
            var supURLs = Array<String>()
            var idx = 0
            entity.supURLs.forEach {url in
                if (!url.starts(with: "http")) {
                    print(url)
                    let supURL = moveFile(entity: entity, sourcePath: url, suffix: "sup\(idx)")
                    if (supURL != nil) {
                        supURLs.append(supURL!)
                    }
                    idx += 1
                }
            }
            entity.supURLs.removeAll()
            supURLs.forEach {supURL in
                entity.supURLs.append(supURL)
            }
        }
        return nil
    }

    func selectEntity(id: ObjectId) -> PaperEntity? {
        return realm.object(ofType: PaperEntity.self, forPrimaryKey: id) ?? nil
    }

    func deleteEntity(entity: PaperEntity) {
        deleteTags(tags: entity.tags)
        deleteFolders(folders: entity.folders)
        deleteFiles(entity: entity)
        try! realm.write {
            realm.delete(entity)
        }
    }
    
    func deleteEntitybyID(id: ObjectId) {
        deleteEntitybyIDs(ids: [id])
    }

    func deleteEntitybyIDs(ids: Set<ObjectId>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            deleteEntity(entity: entity)
        }
    }


    func rateEntitybyID(id: ObjectId, value: Int) {
        let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
        try! realm.write {
            entity.rating = value
        }
    }

    func flagEntity(entity: PaperEntity) {
        try! realm.write {
            entity.flag = !entity.flag
        }
    }
    
    func flagEntitybyIDs(ids: Set<ObjectId>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            flagEntity(entity: entity)
        }
    }

    func updateEntity(entity: PaperEntity) {
        let realm = try! Realm()
        let obj = realm.object(ofType: PaperEntity.self, forPrimaryKey: entity.id)!
        try! realm.write {
            obj.rating = entity.rating
            obj.title = entity.title
            obj.authors = entity.authors
            obj.publication = entity.publication
            obj.pubTime = entity.pubTime
            obj.pubType = entity.pubType
            obj.doi = entity.doi
            obj.arxiv = entity.arxiv
            obj.mainURL = entity.mainURL
            obj.supURLs = entity.supURLs
            obj.rating = entity.rating
            obj.tags = entity.tags
            obj.folders = entity.folders
            obj.flag = entity.flag
            
        }
    }

    func selectAllTags() -> Array<String> {
        let tags = realm.objects(PaperTag.self)
        let tagsList = Array(tags.map{$0.id})
        return tagsList
    }
    
    func selectTagsbyID(id: ObjectId) -> Array<String> {
        let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
        let tagsList = Array(entity.tags.map{$0.id})
        return tagsList
    }

    func addTagsbyIDs(ids: Set<ObjectId>, tags: String) {
        let tagList = tags.components(separatedBy: "; ")
        
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                tagList.forEach { tag in
                    let trimmedTag = tag.trimmingCharacters(in : .whitespaces)
                    if (!trimmedTag.isEmptyOrWhitespace() && !entity.tags.contains{ $0.id == "tag-" + trimmedTag}){
                        var tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: "tag-" + trimmedTag)
                        if (tagObj == nil) {
                            tagObj = PaperTag(id: String(trimmedTag))
                            realm.add(tagObj!)
                        }
                        else{
                            tagObj!.count += 1
                        }
                        entity.tags.append(tagObj!)
                    }
                    else {
                        print("Exist " + trimmedTag)
                    }
                }
            }
        }
    }

    func deleteTags(tags: List<PaperTag>) {
        tags.forEach { tag in
            let tagObj = realm.object(ofType: PaperTag.self, forPrimaryKey: tag.id)!
            try! realm.write {
                tagObj.count -= 1
                if (tagObj.count <= 0) {
                    realm.delete(tagObj)
                }
            }
        }
    }

    func deleteTagsbyIDs(ids: Set<ObjectId>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                entity.tags.forEach { tag in
                    tag.count -= 1
                    if (tag.count <= 0) {
                        realm.delete(tag)
                    }
                }
                entity.tags.removeAll()
            }
        }
    }
    
    func selectAllFolders() -> Array<String> {
        let folders = realm.objects(PaperFolder.self)
        let foldersList = Array(folders.map{$0.id})
        return foldersList
    }
    
    func selectFoldersbyID(id: ObjectId) -> Array<String> {
        let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
        let foldersList = Array(entity.folders.map{$0.id})
        return foldersList
    }

    func addFoldersbyIDs(ids: Set<ObjectId>, folders: String) {
        let folderList = folders.components(separatedBy: "; ")
        
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                folderList.forEach { folder in
                    let trimmedFolder = folder.trimmingCharacters(in : .whitespaces)
                    if (!trimmedFolder.isEmptyOrWhitespace() && !entity.folders.contains{ $0.id == "folder-" + trimmedFolder}){
                        var folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: "folder-" + trimmedFolder)
                        if (folderObj == nil) {
                            folderObj = PaperFolder(id: String(trimmedFolder))
                            realm.add(folderObj!)
                        }
                        else{
                            folderObj!.count += 1
                        }
                        entity.folders.append(folderObj!)
                    }
                    else {
                        print("Exist " + trimmedFolder)
                    }
                }
            }
        }
    }

    func deleteFolders(folders: List<PaperFolder>) {
        folders.forEach { folder in
            let folderObj = realm.object(ofType: PaperFolder.self, forPrimaryKey: folder.id)!
            try! realm.write {
                folderObj.count -= 1
                if (folderObj.count <= 0) {
                    realm.delete(folderObj)
                }
            }
        }
    }

    func deleteFoldersbyIDs(ids: Set<ObjectId>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                entity.folders.forEach { folder in
                    folder.count -= 1
                    if (folder.count <= 0) {
                        realm.delete(folder)
                    }
                }
                entity.folders.removeAll()
            }
        }
    }
    
    func moveFile(entity: PaperEntity, sourcePath: String?, suffix: String = "main") -> String? {
        if (sourcePath == nil) {
            return nil
        }
        let id = String(entity.id)
        let fileName = "\(entity.title.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ":", with: "_"))_\(id)_\(suffix)".replacingOccurrences(of: " ", with: "_")
        let sourceURL = URL(string: sourcePath!)
        if (sourceURL == nil) {
            print("Cannot move " + sourcePath!)
            return nil
        }
        let sourceExtension = sourceURL!.pathExtension
        if (self.dbFolder != nil) {
            let targetURL = URL(string: self.dbFolder!)?.appendingPathComponent("\(fileName)").appendingPathExtension(sourceExtension)

            if !FileManager.default.fileExists(atPath: targetURL!.path) {
                do {
                    try FileManager.default.copyItem(atPath: sourceURL!.path, toPath: targetURL!.path)
                }
                catch {
                    print("Cannot move "+sourceURL!.path)
                }
            }
            
            return targetURL!.absoluteString
        }
        else {
            return sourcePath!
        }
    }
    
    func deleteFiles(entity: PaperEntity) {
        if entity.mainURL != nil {
            let mainURL = URL(string: entity.mainURL!)
            do {
                try FileManager.default.removeItem(atPath: mainURL!.path)
            }
            catch {
                print("Cannot delete "+mainURL!.path)
            }
        }
        entity.supURLs.forEach { url in
            let supURL = URL(string: url)
            do {
                try FileManager.default.removeItem(atPath: supURL!.path)
            }
            catch {
                print("Cannot delete "+supURL!.path)
            }
        }
    }
    
    func addSupsbyIDs(ids: Set<ObjectId>, sups: Array<String>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                sups.forEach { sup in
                    entity.supURLs.append(sup)
                }
            }
        }
    }
    
    func deleteSupsbyIDs(ids: Set<ObjectId>, sups: Array<String>) {
        ids.forEach { id in
            let entity = realm.object(ofType: PaperEntity.self, forPrimaryKey: id)!
            try! realm.write {
                sups.forEach { sup in
                    let filteredSupURLS = entity.supURLs.filter({
                        $0 != sup
                    })
                    entity.supURLs.removeAll()
                    filteredSupURLS.forEach { url in
                        entity.supURLs.append(url)
                    }
                }
            }
        }
    }
}


// ===========================================================================

extension String {
    func isEmptyOrWhitespace() -> Bool {
        
        // Check empty string
        if self.isEmpty {
            return true
        }
        // Trim and check empty string
        return (self.trimmingCharacters(in: .whitespaces) == "")
    }
}
