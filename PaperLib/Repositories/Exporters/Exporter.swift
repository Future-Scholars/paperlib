//
//  Exporter.swift
//  PaperLib
//
//  Created by GeoffreyChen on 16/02/2022.
//

import Foundation
import Alamofire
import Combine
import SwiftUI

enum ExportFormat {
    case plain
    case bibtex
}

class Exporter {
    func export(entities: [PaperEntity], format: ExportFormat) {
        switch format {
        case .plain:
            return self._exportPlain(entities: entities)
        case .bibtex:
            return self._exportBibtex(entities: entities)
        }
    }

    func _replacePublication(_ publication: String) -> String {
        do {
            if let exportReplacement = UserDefaults.standard.data(forKey: "exportReplacement"), UserDefaults.standard.bool(forKey: "enableExportReplacement") {
                let exportReplacementMap = try JSONDecoder().decode([String: String].self, from: exportReplacement)
                if let replace = exportReplacementMap[publication] {
                    return replace
                } else {
                    return publication
                }
            } else {
                return publication
            }
        } catch let err {
            print(err)
            return publication
        }
    }
}

extension Exporter {
    func _exportPlain(entities: [PaperEntity]) {
        var allPlain = ""

        entities.forEach { entity in
            let text = "\(entity.authors). \"\(entity.title)\" In \(_replacePublication(entity.publication)), \(entity.pubTime). \n\n"
            allPlain += text
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        pasteBoard.writeObjects([allPlain as NSString])
    }
}

extension Exporter {
    func _exportBibtex(entities: [PaperEntity]) {
        var allTexBib = ""

        entities.forEach { entity in
            var citeKey = ""
            citeKey += entity.authors.split(separator: " ")[0] + "_"
            citeKey += entity.pubTime + "_"
            citeKey += formatString(String(entity.title[..<String.Index(utf16Offset: 3, in: entity.title)]), removeNewline: true, removeWhite: true, removeSymbol: true)!
            var texbib = ""
            if entity.pubType == 1 {
                texbib = """
                @inproceedings{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    booktitle = {\(_replacePublication(entity.publication))},
                }
                """
            } else {
                texbib = """
                @article{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    journal = {\(_replacePublication(entity.publication))},
                }
                """
            }
            allTexBib += texbib + "\n\n"
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        pasteBoard.writeObjects([allTexBib as NSString])
    }
}
