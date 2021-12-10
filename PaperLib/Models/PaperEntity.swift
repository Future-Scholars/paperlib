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
    @Persisted var pubType: Int? // 0: Article; 1: Conference; 2: Others
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
        supURLs: [String]?,
        rating: Int?,
        addTime: Date?,
        flag: Bool?
    ) {
        self.init()

        id = ObjectId.generate()
        if addTime != nil {
            self.addTime = addTime!
        } else {
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
        supURLs?.forEach { supURL in
            self.supURLs.append(supURL)
        }
        self.rating = rating
        self.flag = flag != nil ? flag! : false
    }

    override static func primaryKey() -> String? {
        return "id"
    }

    func setValue(for key: String, value: Any?, allowEmpty: Bool = false) {
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
        } else if formatedValue == nil, allowEmpty {
            setValue(formatedValue, forKey: key)
            return
        } else {
            setValue(formatedValue, forKey: key)
            return
        }
    }
}

class EditPaperEntity {
    var id: ObjectId
    var addTime: Date

    var title: String
    var authors: String
    var publication: String
    var pubTime: String
    var pubType: String
    var doi: String
    var arxiv: String
    var mainURL: String?
    var supURLs: [String]
    var rating: Int
    var tags: String
    var folders: String
    var flag: Bool

    init() {
        id = ObjectId.generate()
        addTime = Date()

        title = ""
        authors = ""
        publication = ""
        pubTime = ""
        pubType = ""
        doi = ""
        arxiv = ""
        mainURL = ""
        supURLs = .init()
        rating = 0
        tags = ""
        folders = ""
        flag = false
    }

    init(from entity: PaperEntity) {
        id = entity.id
        addTime = entity.addTime

        title = entity.title
        authors = entity.authors
        publication = entity.publication
        pubTime = entity.pubTime
        pubType = ["Journal", "Conference", "Others"][entity.pubType ?? 0]
        doi = entity.doi ?? ""
        arxiv = entity.arxiv ?? ""
        mainURL = entity.mainURL
        supURLs = .init()
        supURLs = Array(entity.supURLs)

        rating = entity.rating ?? 0
        tags = Array(entity.tags.map { formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; ")
        folders = Array(entity.folders.map { formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; ")
        flag = entity.flag
    }

    func setFrom(from entity: PaperEntity) {
        id = entity.id
        addTime = entity.addTime

        title = entity.title
        authors = entity.authors
        publication = entity.publication
        pubTime = entity.pubTime
        pubType = ["Journal", "Conference", "Others"][entity.pubType ?? 0]
        doi = entity.doi ?? ""
        arxiv = entity.arxiv ?? ""
        mainURL = entity.mainURL
        entity.supURLs.forEach { url in
            supURLs.append(url)
        }
        rating = entity.rating ?? 0
        tags = Array(entity.tags.map { formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; ")
        folders = Array(entity.folders.map { formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; ")
        flag = entity.flag
    }

    func buildit() -> PaperEntity {
        let entity = PaperEntity()

        entity.id = id
        entity.addTime = addTime
        entity.title = title
        entity.authors = authors
        entity.publication = publication
        entity.pubTime = pubTime
        entity.pubType = ["Journal", "Conference", "Others"].firstIndex(of: pubType)
        entity.doi = doi
        entity.arxiv = arxiv
        entity.mainURL = mainURL
        entity.supURLs = List()
        supURLs.forEach { url in
            entity.supURLs.append(url)
        }
        entity.rating = rating
        entity.tags = List()
        tags.components(separatedBy: "; ").forEach { tag in
            let tagStr = formatString(tag, returnEmpty: true, trimWhite: true)!
            if !tagStr.isEmpty {
                entity.tags.append(PaperTag(value: PaperTag(id: tagStr)))
            }
        }
        entity.folders = List()
        folders.components(separatedBy: "; ").forEach { folder in
            let folderStr = formatString(folder, returnEmpty: true, trimWhite: true)!
            if !folderStr.isEmpty {
                entity.folders.append(PaperFolder(id: folderStr))
            }
        }
        entity.flag = flag

        return entity
    }
}
