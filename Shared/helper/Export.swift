//
//  Export.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/09/2021.
//

import Foundation
import RealmSwift
import SwiftUI

func exportTexbyEntities(entities: Results<PaperEntity>) {
    var allTexBib = ""
    entities.forEach{ entity in
        var citeKey = ""
        citeKey += entity.authors.split(separator: " ")[0] + "_"
        citeKey += entity.pubTime + "_"
        citeKey += entity.title[..<String.Index(utf16Offset: 3, in: entity.title)]
        var texbib = ""
        if (entity.pubType == 1 || entity.pubType == 2) {
            texbib = """
            @inproceedings{\(citeKey),
                year = \(entity.pubTime),
                title = {\(entity.title)},
                author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                booktitle = {\(entity.publication)},
            }
            """
        } else {
            texbib = """
            @article{\(citeKey),
                year = \(entity.pubTime),
                title = {\(entity.title)},
                author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                journal = {\(entity.publication)},
            }
            """
        }
        allTexBib += texbib + "\n\n"
        print(allTexBib)
    }
    let pasteBoard = NSPasteboard.general
    pasteBoard.clearContents()
    print(allTexBib)
    pasteBoard.writeObjects([allTexBib as NSString])
}


func exportTexbyIDs(ids: Set<ObjectId>) {
    let realm = try! Realm()
    let entities = realm.objects(PaperEntity.self).filter("id in %@", ids)

    var allTexBib = ""
    entities.forEach{ entity in
        var citeKey = ""
        citeKey += entity.authors.split(separator: " ")[0] + "_"
        citeKey += entity.pubTime + "_"
        citeKey += entity.title[..<String.Index(utf16Offset: 3, in: entity.title)]
        var texbib = ""
        if (entity.pubType == 1 || entity.pubType == 2) {
            texbib = """
            @inproceedings{\(citeKey),
                year = \(entity.pubTime),
                title = {\(entity.title)},
                author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                booktitle = {\(entity.publication)},
            }
            """
        } else {
            texbib = """
            @article{\(citeKey),
                year = \(entity.pubTime),
                title = {\(entity.title)},
                author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                journal = {\(entity.publication)},
            }
            """
        }
        allTexBib += texbib + "\n\n"
        print(allTexBib)
    }
    let pasteBoard = NSPasteboard.general
    pasteBoard.clearContents()
    print(allTexBib)
    pasteBoard.writeObjects([allTexBib as NSString])
}
