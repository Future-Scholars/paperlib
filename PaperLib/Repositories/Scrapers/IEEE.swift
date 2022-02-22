//
//  IEEE.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyJSON

struct IEEEScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = !entityDraft.title.isEmpty && (entityDraft.publication == "arXiv" || entityDraft.publication.isEmpty) && !formatString(UserDefaults.standard.string(forKey: "ieeeAPIKey"))!.isEmpty && UserDefaults.standard.bool(forKey: "ieeeScraper")

        var title = formatString(entityDraft.title, removeNewline: true)!
        title = title.replacingOccurrences(of: " ", with: "+")
        let scrapeURL = [
            "http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=\(formatString(UserDefaults.standard.string(forKey: "ieeeAPIKey"))!)",
            "&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=\(title)"
        ].joined()
        let headers: HTTPHeaders = ["Accept": "application/json"]

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {
                let jsonData = response.data(using: .utf8)!
                let ieeeData = try JSON(data: jsonData)

                if ieeeData["total_records"] > 0 {
                    var title: String
                    var authors: String
                    var pubTime: String
                    var pubType: String
                    var publication: String

                    let hits = ieeeData["articles"]

                    for hit in hits {
                        let hitTitle = hit.1["title"].stringValue
                        var plainHitTitle = hit.1["title"].stringValue
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
                            let authorResults = hit.1["authors"]["authors"]

                            authorResults.forEach { author in
                                authorsList.append(author.1["full_name"].stringValue.trimmingCharacters(in: CharacterSet.letters.inverted))
                            }

                            authors = String(authorsList.joined(separator: ", "))

                            pubTime = hit.1["publication_year"].stringValue

                            if hit.1["content_type"].stringValue.contains("Articles") {
                                pubType = "Journal"
                            } else if hit.1["content_type"].stringValue.contains("Conferences") {
                                pubType = "Conference"
                            } else {
                                pubType = "Others"
                            }

                            publication = hit.1["publication_title"].stringValue

                            entityDraft.set(for: "title", value: title, allowEmpty: false)
                            entityDraft.set(for: "authors", value: authors, allowEmpty: false)
                            entityDraft.set(for: "pubTime", value: pubTime, allowEmpty: false)
                            entityDraft.set(for: "pubType", value: pubType, allowEmpty: false)
                            entityDraft.set(for: "publication", value: publication, allowEmpty: false)

                            break
                        }
                    }
                }

                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.ieeeError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.ieeeError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }
}
