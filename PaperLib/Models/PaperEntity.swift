//
//  PaperEntity.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperEntity: Object, ObjectKeyIdentifiable {
    @Persisted var id: ObjectId
    @Persisted var addTime: Date

    @Persisted var title: String = ""
    @Persisted var authors: String = ""
    @Persisted var publication: String = ""
    @Persisted var pubTime: String = ""
    @Persisted var pubType: Int = 2 // 0: Article; 1: Conference; 2: Others
    @Persisted var doi: String = ""
    @Persisted var arxiv: String = ""
    @Persisted var mainURL: String = ""
    @Persisted var supURLs: List<String>
    @Persisted var rating: Int = 0
    @Persisted var tags: List<PaperTag>
    @Persisted var folders: List<PaperFolder>
    @Persisted var flag: Bool = false
    @Persisted var note: String = ""
    

    convenience init(
        title: String?,
        authors: String?,
        publication: String?,
        pubTime: String?,
        pubType: Int?,
        doi: String?,
        arxiv: String?,
        mainURL: String?,
        supURLs: [String]?,
        rating: Int?,
        flag: Bool?
    ) {
        self.init()

        id = ObjectId.generate()
        self.addTime = Date()

        self.title = title ?? ""
        self.authors = authors ?? ""
        self.publication = publication ?? ""
        self.pubTime = pubTime ?? ""
        self.pubType = pubType ?? 2
        self.doi = doi ?? ""
        self.arxiv = arxiv ?? ""
        self.mainURL = mainURL ?? ""
        supURLs?.forEach { supURL in
            self.supURLs.append(supURL)
        }
        self.rating = rating ?? 0
        self.flag = flag ?? false
        
        print("create entity")
    }

    override static func primaryKey() -> String? {
        return "id"
    }

    func setValue(for key: String, value: Any?, allowEmpty: Bool = false) {
        guard value != nil || allowEmpty else  { return }
        
        var formatedValue = value
        if formatedValue is String {
            if key == "title" || key == "authors" {
                formatedValue = formatString(formatedValue as? String, removeNewline: true, removeStr: ".")
            }
            if (formatedValue as! String).isEmpty {
                if allowEmpty {
                    setValue(formatedValue, forKey: key)
                }
                return
            } else {
                setValue(formatedValue, forKey: key)
            }
        } else {
            setValue(formatedValue, forKey: key)
            return
        }
    }
}


class PaperEntityDraft1 {
    var wrapper: Dictionary<String, Any>
    
    init() {
        self.wrapper = .init()
        
        self.wrapper["id"] = ObjectId.generate()
        self.wrapper["addTime"] = Date()

        self.wrapper["title"] = ""
        self.wrapper["authors"] = ""
        self.wrapper["publication"] = ""
        self.wrapper["pubTime"] = ""
        self.wrapper["pubType"] = ""
        self.wrapper["doi"] = ""
        self.wrapper["arxiv"] = ""
        self.wrapper["mainURL"] = ""
        self.wrapper["supURLs"] = []
        self.wrapper["rating"] = 0
        self.wrapper["tags"] = ""
        self.wrapper["folders"] = ""
        self.wrapper["flag"] = false
        self.wrapper["note"] = ""

    }

    init(from entity: PaperEntity) {
        self.wrapper = .init()
        
        self.wrapper["id"] = entity.id
        self.wrapper["addTime"] = entity.addTime

        self.wrapper["title"] = entity.title
        self.wrapper["authors"] = entity.authors
        self.wrapper["publication"] = entity.publication
        self.wrapper["pubTime"] = entity.pubTime
        self.wrapper["pubType"] = ["Journal", "Conference", "Others"][entity.pubType]
        self.wrapper["doi"] = entity.doi
        self.wrapper["arxiv"] = entity.arxiv
        self.wrapper["mainURL"] = entity.mainURL
        self.wrapper["supURLs"] = Array(entity.supURLs)
        self.wrapper["rating"] = entity.rating
        self.wrapper["tags"] = Array(entity.tags.map { formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; ")
        self.wrapper["folders"] = Array(entity.folders.map { formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; ")
        self.wrapper["flag"] = entity.flag
        self.wrapper["note"] = entity.note

    }
    
    func set(for key: String, value: Any?, allowEmpty: Bool = false) {
        guard value != nil || allowEmpty else  { return }
        
        var formatedValue = value
        if formatedValue is String {
            if key == "title" || key == "authors" {
                formatedValue = formatString(formatedValue as? String, removeNewline: true, removeStr: ".")
            }
            if (formatedValue as! String).isEmpty {
                if allowEmpty {
                    self.wrapper[key] = value
                }
                return
            } else {
                self.wrapper[key] = formatedValue
            }
        } else {
            self.wrapper[key] = formatedValue
            return
        }
    }
    
    func get<T>(_ key: String, type: T.Type) -> T {
        return self.wrapper[key] as! T
    }
    
}


class PaperEntityDraft: NSObject {
    @objc var id: ObjectId = .generate()
    @objc var addTime: Date = .init()

    @objc var title: String = ""
    @objc var authors: String = ""
    @objc var publication: String = ""
    @objc var pubTime: String = ""
    @objc var pubType: String = "Others" // 0: Article; 1: Conference; 2: Others
    @objc var doi: String = ""
    @objc var arxiv: String = ""
    @objc var mainURL: String = ""
    @objc var supURLs: [String] = .init()
    @objc var rating: Int = 0
    @objc var tags: String = ""
    @objc var folders: String = ""
    @objc var flag: Bool = false
    @objc var note: String = ""
    
    override init() {
        super.init()
    }
    
    init(from entity: PaperEntity) {
        id = entity.id
        addTime = entity.addTime

        title = entity.title
        authors = entity.authors
        publication = entity.publication
        pubTime = entity.pubTime
        pubType = ["Journal", "Conference", "Others"][entity.pubType]
        doi = entity.doi
        arxiv = entity.arxiv
        mainURL = entity.mainURL
        supURLs = Array(entity.supURLs)
        rating = entity.rating
        tags = Array(entity.tags.map { formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; ")
        folders = Array(entity.folders.map { formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; ")
        flag = entity.flag
        note = entity.note

    }

    func set(for key: String, value: Any?, allowEmpty: Bool = false) {
        guard value != nil || allowEmpty else  { return }
        
        var formatedValue = value
        if formatedValue is String {
            if key == "title" || key == "authors" {
                formatedValue = formatString(formatedValue as? String, removeNewline: true, removeStr: ".")
            }
            if (formatedValue as! String).isEmpty {
                if allowEmpty {
                    setValue(formatedValue, forKey: key)
                }
                return
            } else {
                setValue(formatedValue, forKey: key)
            }
        } else {
            setValue(formatedValue, forKey: key)
            return
        }
    }
}
