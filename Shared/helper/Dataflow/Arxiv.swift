//
//  Arxiv.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/07/2021.
//

import Foundation
import SwiftyXMLParser
import Alamofire


func requestArxiv(entity: PaperEntity?) -> PaperEntity? {
    var title: String?
    var authors: String?
    var pubTime: String?
    
    guard (entity != nil) else {return nil}
    guard (entity?.arxiv != nil && entity?.arxiv != "") else {return entity}
    let sem = DispatchSemaphore.init(value: 0)
    
    var arxiv = entity?.arxiv ?? "arXiv:"
    if arxiv.starts(with: "arXiv:") {
        arxiv = String(arxiv[arxiv.index(arxiv.startIndex, offsetBy: 6)...])
    }
    let urlString = "https://export.arxiv.org/api/query?id_list=\(arxiv)".trimmingCharacters(in: .whitespacesAndNewlines)
    print(urlString)
    let headers: HTTPHeaders = [
        "accept-encoding": "UTF-32BE",
    ]

    AF.request(urlString, headers: headers).response { response in
        defer { sem.signal() }
        let data = response.data
        let xmlString = String(decoding: data!, as: UTF8.self)
        let xml = try! XML.parse(xmlString)
        title = xml["feed"]["entry"]["title"].text ?? ""
        let authorList = xml["feed"]["entry"]["author"].all ?? []
        var authorStrs = Array<String>()
        authorList.forEach { author in
            authorStrs.append(author.childElements[0].text ?? "")
        }
        authors = authorStrs.joined(separator: ", ")
        let pubDate = xml["feed"]["entry"]["published"].text
        pubTime = pubDate == nil ? "" : String(pubDate![...pubDate!.index(pubDate!.startIndex, offsetBy: 3)])
    }
    
    sem.wait()
    
    entity?.title = title ?? (entity?.title ?? "")
    entity?.authors = authors ?? (entity?.authors ?? "")
    entity?.publication = "arXiv"
    entity?.pubType = 0
    entity?.pubTime = pubTime ?? (entity?.pubTime ?? "")
    
    return entity
}
