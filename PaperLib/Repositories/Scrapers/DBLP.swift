//
//  DBLP.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyJSON

func dblpParsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
    if let response = response {
        do {
            let jsonData = response.data(using: .utf8)!
            let dblpData = try JSON(data: jsonData)

            var title: String
            var authors: String
            var pubTime: String
            var pubType: String
            var pubKey: String

            if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                let hits = dblpData["result"]["hits"]["hit"]

                for hit in hits {
                    let paperInfo = hit.1["info"]
                    let hitTitle = paperInfo["title"].stringValue
                    var plainHitTitle = paperInfo["title"].stringValue
                    plainHitTitle = formatString(plainHitTitle, removeStr: "&amp")!
                    plainHitTitle = formatString(plainHitTitle, removeSymbol: true, lowercased: true)!

                    var existTitle = formatString(entityDraft.title, removeStr: "&amp")!
                    existTitle = formatString(existTitle, removeSymbol: true, lowercased: true)!

                    if plainHitTitle != existTitle {
                        continue
                    } else {
                        // Title
                        title = hitTitle.replacingOccurrences(of: "&amp;", with: "&")
                        // Authors
                        var authorsList = [String]()
                        let authorResults = paperInfo["authors"]["author"]

                        if authorResults["@pid"].exists() {
                            authorsList.append(authorResults["text"].stringValue.trimmingCharacters(in: CharacterSet.letters.inverted))
                        } else {
                            paperInfo["authors"]["author"].forEach { author in
                                authorsList.append(author.1["text"].stringValue.trimmingCharacters(in: CharacterSet.letters.inverted))
                            }
                        }

                        authors = String(authorsList.joined(separator: ", "))

                        pubTime = paperInfo["year"].stringValue
                        pubType = [
                            "Conference and Workshop Papers": "Conference",
                            "Journal Articles": "Journal"
                        ][paperInfo["type"].stringValue] ?? "Others"
                        pubKey = "dblp://\(paperInfo["key"].stringValue.components(separatedBy: "/")[...1].joined(separator: "/"))"
                        // Do not allow response of "CoRR"
                        if pubKey != "dblp://journals/corr" {
                            entityDraft.set(for: "title", value: title, allowEmpty: false)
                            entityDraft.set(for: "authors", value: authors, allowEmpty: false)
                            entityDraft.set(for: "pubTime", value: pubTime, allowEmpty: false)
                            entityDraft.set(for: "pubType", value: pubType, allowEmpty: false)
                            entityDraft.set(for: "publication", value: pubKey, allowEmpty: false)

                            break
                        }

                    }
                }
            }

            return Just<PaperEntityDraft>
                .withErrorType(entityDraft, WebError.self)
                .eraseToAnyPublisher()
        } catch {
            return Fail(error: WebError.dblpError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }
    } else {
        return Fail(error: WebError.dblpError(entityDraft: entityDraft)).eraseToAnyPublisher()
    }

}

struct DBLPScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        var dblpQuery = formatString(entityDraft.title, removeStr: "&amp")!
        dblpQuery = formatString(dblpQuery, removeStr: "&")!

        let enable = !dblpQuery.isEmpty

        var scrapeURL = "https://dblp.org/search/publ/api?q=\(dblpQuery)&format=json"
        scrapeURL = scrapeURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let headers: HTTPHeaders = []

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        return dblpParsingProcess(response: response, entityDraft: entityDraft)
    }
}

struct DBLPVenueScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = entityDraft.publication.starts(with: "dblp://")

        entityDraft.publication = entityDraft.publication.replacingOccurrences(of: "dblp://", with: "")
        var scrapeURL = "https://dblp.org/search/venue/api?q=\(entityDraft.publication)&format=json"
        scrapeURL = scrapeURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let headers: HTTPHeaders = []
        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {
                let jsonData = response.data(using: .utf8)!
                let dblpData = try JSON(data: jsonData)

                if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                    let hit = dblpData["result"]["hits"]["hit"].first!
                    let venueInfo = hit.1["info"]
                    let venue = venueInfo["venue"].stringValue
                    entityDraft.set(for: "publication", value: venue, allowEmpty: false)
                }

                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.dblpError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.dblpError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }
}

struct DBLPbyTimeScraper: Scraper {
    var offset: Int

    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let year = Int(entityDraft.pubTime)
        var dblpQuery = formatString(entityDraft.title, removeStr: "&amp")!
        dblpQuery = formatString(dblpQuery, removeStr: "&")! + " " + "year:\(year ?? 0 + offset)"

        let enable = !dblpQuery.isEmpty

        var scrapeURL = "https://dblp.org/search/publ/api?q=\(dblpQuery)&format=json"
        scrapeURL = scrapeURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let headers: HTTPHeaders = []
        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        return dblpParsingProcess(response: response, entityDraft: entityDraft)
    }
}
