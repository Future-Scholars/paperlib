//
//  DOI.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyJSON

struct DOIScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = !entityDraft.doi.isEmpty && UserDefaults.standard.bool(forKey: "doiScraper")

        let doiID = formatString(entityDraft.doi, removeNewline: true, removeWhite: true)!
        let scrapeURL = "https://dx.doi.org/\(doiID)"
        let headers: HTTPHeaders = ["Accept": "application/json"]

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {

                let jsonData = response.data(using: .utf8)!
                let doiData = try JSON(data: jsonData)

                // Title
                let title = doiData["title"].stringValue
                // Authors
                let authors = doiData["author"].map { (_, author) in
                    "\(author["given"]) \(author["family"])"
                }.joined(separator: ", ")
                // PubTime
                let pubTime = "\(doiData["published"]["date-parts"].first?.1.first?.1 ?? "")"
                // Publication
                let pub = doiData["container-title"].stringValue
                // Type
                var pubType: String
                if doiData["type"].stringValue == "proceedings-article" {
                    pubType = "Conference"
                } else if doiData["type"].stringValue == "journal-article" {
                    pubType = "Journal"
                } else {
                    pubType = "Others"
                }

                entityDraft.set(for: "title", value: title, allowEmpty: false)
                entityDraft.set(for: "authors", value: authors, allowEmpty: false)
                entityDraft.set(for: "publication", value: pub, allowEmpty: false)
                entityDraft.set(for: "pubTime", value: pubTime, allowEmpty: false)
                entityDraft.set(for: "pubType", value: pubType, allowEmpty: false)

                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.doiError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.doiError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }
}
