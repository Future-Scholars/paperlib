//
//  PDFutils.swift
//  PaperLib
//
//  Created by GeoffreyChen on 19/07/2021.
//

import PDFKit

func readPDF(url: URL) -> PaperEntity? {
    let document = PDFDocument(url: url) ?? nil
    
    guard (document != nil) else {
        return nil
    }
    let entity = PaperEntity()
    
    let title = document?.documentAttributes?[PDFDocumentAttribute.titleAttribute]
    let authors = document?.documentAttributes?[PDFDocumentAttribute.authorAttribute]
        
    entity.title = makeValideString(str: title as? String ?? "")
    entity.authors = authors as? String ?? ""

    entity.doi = extractDOI(document: document ?? nil)
    entity.arxiv = extractArxiv(document: document ?? nil)
    
    entity.mainURL = url.absoluteString
        
    return entity
}


func extractDOI(document: PDFDocument?) -> String? {
    var doi: String? = nil
    let pattern = "(?:(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%\"#? ])\\S)+))"
    
    // From subject metadata
    let subject = document?.documentAttributes?[PDFDocumentAttribute.subjectAttribute] ?? ""
    let subjectMatch = matches(for: pattern, in: subject as! String)
    doi = subjectMatch.first ?? nil
    
    if (doi == nil) {
        // From fulltext
        let page = document?.page(at: 0)
        let pageContent = page?.attributedString

        let fulltextMatch = matches(for: pattern, in: pageContent?.string ?? "")
        doi = fulltextMatch.first ?? nil
        
        
    }
    return doi
}

func extractArxiv(document: PDFDocument?) -> String? {
    var arxiv: String? = nil
    let pattern = "arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?"
    
    // From subject metadata
    let subject = document?.documentAttributes?[PDFDocumentAttribute.subjectAttribute] ?? ""
    let subjectMatch = matches(for: pattern, in: subject as! String)
    arxiv = subjectMatch.first ?? nil
    
    if (arxiv == nil) {
        // From fulltext
        let page = document?.page(at: 0)
        let pageContent = page?.attributedString

        let fulltextMatch = matches(for: pattern, in: pageContent?.string ?? "")
        arxiv = fulltextMatch.first ?? nil
        
        
    }
    return arxiv
}



func matches(for regex: String, in text: String) -> [String] {

    do {
        let regex = try NSRegularExpression(pattern: regex)
        let results = regex.matches(in: text, range: NSRange(text.startIndex..., in: text))
        return results.map {
            String(text[Range($0.range, in: text)!])
        }
    } catch let error {
        print("invalid regex: \(error.localizedDescription)")
        return []
    }
}
