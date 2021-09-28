//
//  Arxiv.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/07/2021.
//

import Foundation
import SwiftyJSON
import Alamofire
import SwiftyBibtex


func latexToStr(latex: String?) -> String? {
    return latex?.replacingOccurrences(of: "\\textendash", with: "-").replacingOccurrences(of: "\\textemdash", with: "-").replacingOccurrences(of: "{", with: "").replacingOccurrences(of: "}", with: "")
}


func requestDOI(entity: PaperEntity?) -> PaperEntity? {
    var title: String?
    var authors: String?
    var pubTime: String?
    var pubType: Int?
    var publication: String?
    
    guard (entity != nil) else {return nil}
    guard (entity?.doi != nil && entity?.doi != "") else {return entity}
    let sem = DispatchSemaphore.init(value: 0)
    
    var urlString = "https://dx.doi.org/\(entity?.doi ?? "")"
    urlString = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    let headers: HTTPHeaders = [
        "Accept": "application/x-bibtex",
    ]
    
    AF.request(urlString, headers: headers).response { response in
        defer { sem.signal() }
        let data = response.data
        let bibtexString = String(decoding: data!, as: UTF8.self)
        let bibtex = try? SwiftyBibtex.parse(bibtexString)
        let bibtexMeta = bibtex?.publications[0]
        title = latexToStr(latex: bibtexMeta?.fields["title"])
        authors = bibtexMeta?.fields["author"]?.replacingOccurrences(of: " and ", with: ", ")
        pubTime = bibtexMeta?.fields["year"]
        var publicationKey: String
        if (bibtexMeta?.publicationType == PublicationType.article) {
            pubType = 0
            publicationKey = "journal"
        }
        else if (bibtexMeta?.publicationType == PublicationType.inProceedings || bibtexMeta?.publicationType == PublicationType.inCollection || bibtexMeta?.publicationType == PublicationType.proceedings) {
            pubType = 1
            publicationKey = "booktitle"
        }
        else {
            pubType = 2
            publicationKey = "journal"
        }
        publication = latexToStr(latex: bibtexMeta?.fields[publicationKey])?.replacingOccurrences(of: "{", with: "").replacingOccurrences(of: "}", with: "")
    }
    sem.wait()
    
    entity?.title = title ?? (entity?.title ?? "")
    entity?.authors = authors ?? (entity?.authors ?? "")
    entity?.publication = publication ?? (entity?.publication ?? "")
    entity?.pubType = pubType
    entity?.pubTime = pubTime ?? (entity?.pubTime ?? "")
    
    return entity
}
