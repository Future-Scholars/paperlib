//
//  PaperEntityCache.swift
//  PaperLib
//
//  Created by GeoffreyChen on 11/03/2022.
//

import Foundation
import RealmSwift

class PaperEntityCache: Object, ObjectKeyIdentifiable {
    @Persisted var fulltext: String = ""
    @Persisted var id: ObjectId

    convenience init(id: ObjectId, fulltext: String?) {
        self.init()
        self.id = id
        self.fulltext = fulltext ?? ""
    }
}
