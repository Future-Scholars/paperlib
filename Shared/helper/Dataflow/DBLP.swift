//
//  Arxiv.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/07/2021.
//

import Foundation
import SwiftyJSON
import Alamofire


let pubTypeMap = [
    "Conference and Workshop Papers": 1,
    "Journal Articles": 0
]

let venueID = [
    "ICCV": 1,
    "ICCV Workshop": 0
]

let predefinedVenue = [
    "Pattern Recognit.": "Pattern Recognition",
    "CoRR": "arXiv"
]


func requestDBLP(entity: PaperEntity?) -> PaperEntity? {
    var title: String?
    var authors: String?
    var pubTime: String?
    var pubType: Int?
    var publication: String?
    var venue: String?
    
    
    guard (entity != nil) else {return nil}
    guard (entity?.title != nil && entity?.title != "") else {return entity}
    let sem = DispatchSemaphore.init(value: 0)
    
    var urlString = "http://dblp.org/search/publ/api?q=\(entity?.title ?? "")&format=json"
    urlString = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    
    AF.request(urlString).response { response in
        defer { sem.signal() }
        let data = response.data
        let json = try! JSON(data: data!)

        if (json["result"]["hits"]["@total"].intValue > 0) {

            let hits = json["result"]["hits"]["hit"]
            for hit in hits {
                let paperInfo = hit.1["info"]
                
                let hitTitle = paperInfo["title"].stringValue
                
                if (hitTitle.letters.lowercased() != entity?.title.letters.lowercased()) {
                    continue
                }
                else {
                    title = hitTitle
                    
                    venue = paperInfo["venue"].stringValue
                    if (venue != "CoRR") {
                        var authorsListRaw = Array<String>()
                        paperInfo["authors"]["author"].forEach {author in
                            authorsListRaw.append(author.1["text"].stringValue)
                        }
                        var authorsList = Array<String>()
                        authorsListRaw.forEach {author in
                            authorsList.append(author.trimmingCharacters(in: CharacterSet.letters.inverted))
                        }
                        
                        authors = String(authorsList.joined(separator: ", "))
                        pubTime = paperInfo["year"].stringValue
                        pubType = pubTypeMap[paperInfo["type"].stringValue] ?? 2
                        
                        break
                    }
                }
            }
            
        }
    }
    sem.wait()
    

    if (predefinedVenue[venue ?? ""] == nil) {
        print(venue)
        var urlVenueString = "https://dblp.org/search/venue/api?q=\(venue ?? "")&format=json"
        urlVenueString = urlVenueString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        AF.request(urlVenueString).response { response in
            defer { sem.signal() }
            let data = response.data
            let json = try! JSON(data: data!)
            if (json["result"]["hits"]["@total"].intValue > 0) {
                let hits = json["result"]["hits"]["hit"]
                let id = Int(venueID[venue ?? ""] ?? 0)

                let venueInfo = hits[id]["info"]
                publication = venueInfo["venue"].stringValue

            }
        }
    }
    else {
        defer { sem.signal() }
        venue = predefinedVenue[venue!]!
    }
    
    sem.wait()
    
    entity?.title = title ?? (entity?.title ?? "")
    entity?.authors = authors ?? (entity?.authors ?? "")
    if (publication != nil) {
        if (!publication!.isEmpty) {
            entity?.publication = publication!
        }
    }
    
    entity?.pubType = pubType
    entity?.pubTime = pubTime ?? (entity?.pubTime ?? "")
    
    return entity
}


extension String {
    var letters: String {
        return String(unicodeScalars.filter(CharacterSet.letters.contains))
    }
}
