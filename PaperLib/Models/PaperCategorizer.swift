//
//  PaperTag.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

protocol PaperCategorizer: Object {
    var _partition: String? { get set }
    var count: Int { get set }
    var name: String { get set }
    init(name: String)
}

class IDObject: Object {
    @objc dynamic var _id: ObjectId

    override init() {
        self._id = ObjectId.generate()
    }

    override class func primaryKey() -> String? {
        return "_id"
    }

    override class func shouldIncludeInDefaultSchema() -> Bool {
        self != IDObject.self
    }
}

class PaperTag: IDObject, ObjectKeyIdentifiable, PaperCategorizer {
    @Persisted var _partition: String?
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience required init(name: String) {
        self.init()
        self.name = name
    }
}

class PaperFolder: IDObject, ObjectKeyIdentifiable, PaperCategorizer {
    @Persisted var _partition: String?
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience required init(name: String) {
        self.init()
        self.name = name
    }
}
