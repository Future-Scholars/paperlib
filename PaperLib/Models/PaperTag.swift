//
//  PaperTag.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperTag: Object, ObjectKeyIdentifiable {
    @Persisted(primaryKey: true) var id: String = ""
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience init(id: String) {
        self.init()
        self.id = "tag-" + id
        name = id
    }

}
