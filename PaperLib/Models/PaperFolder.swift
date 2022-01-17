//
//  PaperFolder.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperFolderIDObject: Object {
    @objc dynamic var _id: ObjectId
    
    override init() {
        self._id = ObjectId.generate()
    }
    
    override class func primaryKey() -> String? {
        return "_id"
    }

    override class func shouldIncludeInDefaultSchema() -> Bool {
        self != PaperFolderIDObject.self
    }
}

class PaperFolder: PaperFolderIDObject, ObjectKeyIdentifiable {
    @Persisted var _partition: String?
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience init(name: String) {
        self.init()
        self.name = name
    }

}
