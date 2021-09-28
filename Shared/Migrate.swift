//
//  Migrate.swift
//  PaperLib
//
//  Created by GeoffreyChen on 24/09/2021.
//

import Foundation
import SQLite


func migrate(url: String) {
    do{
        let db = try Connection(url)
        let metas = Table("PaperMetas")
        
        let id = Expression<String>("id")
        let title = Expression<String>("title")
        let authors = Expression<String?>("authors")
        let pub = Expression<String>("pub")
        let pubType = Expression<String?>("pubType")
        let pubTime = Expression<Int?>("pubTime")
        let addTime = Expression<String>("addTime")
        let rating = Expression<Int>("rating")
        let tags = Expression<String?>("tags")
        let arxiv = Expression<String?>("arxiv")
        let doi = Expression<String?>("doi")
        let flag = Expression<Int?>("flag")
        
        let files = Table("Files")
        let paperID = Expression<String>("paperID")
        let fileType = Expression<String>("type")
        let filePath = Expression<String>("path")
        
        var metaArray = Array<Dictionary<String, Any>>()
        for meta in try db.prepare(metas) {
            print(meta[flag])
            var paper = [
                "id": meta[id],
                "title": meta[title],
                "authors": meta[authors],
                "pub": meta[pub],
                "pubType": meta[pubType],
                "pubTime": meta[pubTime],
                "addTime": meta[addTime],
                "rating": meta[rating],
                "tags": meta[tags],
                "arxiv": meta[arxiv],
                "doi": meta[doi],
                "flag": meta[flag]
            ] as [String : Any]

            var supURL = Array<String>()
            
            for file in try db.prepare(files.select(fileType, filePath).filter(paperID == meta[id])) {
                if file[fileType] == "paper" {
                    paper["mainURL"] = file[filePath]
                }
                else {
                    supURL.append(file[filePath])
                }
            }
            
            paper["supURL"] = supURL
            
            metaArray.append(
                paper
            )
        }
        
        
        let pldb = PLDatabase()
        
        metaArray.forEach { meta in
            let title = meta["title"] as? String
            let authors = ((meta["authors"] as? String) ?? "").replacingOccurrences(of: " and ", with: "; ")
            let publication = meta["pub"] as? String
            let pubTime = meta["pubTime"] as? Int
            let addTimeStr = meta["addTime"] as? String
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
            dateFormatter.timeZone = TimeZone(abbreviation: "GMT+00:00")//Add this
            let addTime = dateFormatter.date(from: addTimeStr!)

            var pubType: Int
            if (meta["pubType"] as? String == "conference") {
                pubType = 1
            }
            else if (meta["pubType"] as? String == "journal") {
                pubType = 0
            }
            else {
                pubType = 2
            }
            let doi = meta["doi"] as? String
            let arxiv = meta["arxiv"] as? String
            let mainURL = meta["mainURL"] as? String
            let supURLs = meta["supURL"] as? Array<String>
            let rating = meta["rating"] as? Int
            let tags_ = ((meta["tags"] as? String) ?? "").split(separator: ";")
            var tags = Array<String>()
            tags_.forEach { tag in
                tags.append(String(tag))
            }
            let flag = meta["flag"] as? Int

            let entity = PaperEntity(
                title: title,
                authors: authors,
                publication: publication,
                pubTime: pubTime == nil ? nil : String(pubTime!),
                pubType: pubType,
                doi: doi,
                arxiv: arxiv,
                mainURL: mainURL,
                supURLs: supURLs,
                rating: rating,
                addTime: addTime,
                flag: flag == 1 ? true : false
            )
            
            let existEntity = pldb.insertEntity(entity: entity)
            if (existEntity == nil) {
                pldb.addTagsbyIDs(ids: [entity.id], tags: tags.joined(separator: "; "))
            }
            else {
                pldb.addTagsbyIDs(ids: [existEntity!.id], tags: tags.joined(separator: "; "))
            }
        }
        
    } catch {
        print (error)
    }
}
