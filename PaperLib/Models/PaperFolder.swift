//
//  PaperFolder.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Foundation
import RealmSwift

class PaperFolder: Object, ObjectKeyIdentifiable {
    @Persisted(primaryKey: true) var id: String = ""
    @Persisted var count: Int = 0
    @Persisted var name: String = ""

    convenience init(id: String) {
        self.init()
        self.id = "folder-" + id
        name = id
    }

}
