//
//  PaperTag.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperTagIDObject: Object {
    @objc dynamic var id: String
    @objc dynamic var _id: String
    
    override init() {
        self.id = ""
        self._id = self.id
    }
    
    override class func primaryKey() -> String? {
        return "_id"
    }

    override class func shouldIncludeInDefaultSchema() -> Bool {
        self != PaperTagIDObject.self
    }
}


class PaperTag: PaperTagIDObject, ObjectKeyIdentifiable {
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience init(id: String) {
        self.init()
        self.id = "tag-" + id
        self._id = self.id
        name = id
    }

}
