//
//  Flow.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/07/2021.
//

import Foundation
import RealmSwift

func dataflow(url: URL?, e: PaperEntity?, id: ObjectId?) {
    // ==============================
    // Migrate
    if (url?.pathExtension == "db") {
        migrate(url: url!.path)
        
        return
    }
    
    
    // ==============================
    
    
    let db = PLDatabase()
    
    var entity:PaperEntity?
    if (url != nil) {
        entity = readPDF(url: url!)
        if (entity?.arxiv != nil && entity?.arxiv != "") {
            entity = requestArxiv(entity: entity)
        }
        else if (entity?.doi != nil && entity?.doi != "") {
            entity = requestDOI(entity: entity)
        }
        entity = requestDBLP(entity: entity)
        
        if (entity != nil) {db.insertEntity(entity: entity!)}
    }
    
    if (e != nil) {
        entity = e
        if (entity?.arxiv != nil && entity?.arxiv != "") {
            entity = requestArxiv(entity: entity)
        }
        else if (entity?.doi != nil && entity?.doi != "") {
            entity = requestDOI(entity: entity)
        }
        entity = requestDBLP(entity: entity)
        
        if (entity != nil) {db.updateEntity(entity: entity!)}
    }
    
    if (id != nil) {
        entity = db.selectEntity(id: id!)
        entity = deepcopyEntity(entity: entity!)
        if (entity?.arxiv != nil && entity?.arxiv != "") {
            entity = requestArxiv(entity: entity)
        }
        else if (entity?.doi != nil && entity?.doi != "") {
            entity = requestDOI(entity: entity)
        }
        entity = requestDBLP(entity: entity)
        
        if (entity != nil) {db.updateEntity(entity: entity!)}
    }
    print("Match complete")
}
