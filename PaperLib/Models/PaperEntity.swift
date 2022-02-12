//
//  PaperEntity.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperEntityIDObject: Object {
    @objc dynamic var id: ObjectId
    @objc dynamic var _id: ObjectId

    override init() {
        self.id = ObjectId.generate()
        self._id = self.id
    }

    override class func primaryKey() -> String? {
        return "_id"
    }

    override class func shouldIncludeInDefaultSchema() -> Bool {
        self != PaperEntityIDObject.self
    }
}

class PaperEntity: PaperEntityIDObject, ObjectKeyIdentifiable {

    @Persisted var _partition: String?
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

        self.id = self._id

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
        guard value != nil || allowEmpty else { return }

        var formatedValue = value
        if formatedValue is String {
            if key == "title" || key == "authors" {
                formatedValue = formatString(formatedValue as? String, removeNewline: true, removeStr: ".")
            }
            if (formatedValue as? String ?? "").isEmpty {
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
