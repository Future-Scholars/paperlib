//
//  CVF.swift
//  PaperLib
//
//  Created by GeoffreyChen on 18/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyJSON

struct CVFScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = !entityDraft.title.isEmpty && (entityDraft.publication == "arXiv" || entityDraft.publication.isEmpty)

        let shortTitle = formatString(entityDraft.title, removeWhite: true, removeStr: "&amp")!
        let scrapeURL = "https://paperlib.geoch.top/api/cvf/\(shortTitle)"
        let headers: HTTPHeaders = []

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {
                let jsonData = response.data(using: .utf8)!
                let cvfData = try JSON(data: jsonData)

                // PubTime
                let pubTime = cvfData["year"].stringValue
                // Publication
                let pub = cvfData["booktitle"].stringValue
                // Type
                var pubType: String
                if cvfData["ENTRYTYPE"].stringValue == "inproceedings" {
                    pubType = "Conference"
                } else if cvfData["type"].stringValue == "article" {
                    pubType = "Journal"
                } else {
                    pubType = "Others"
                }

                entityDraft.set(for: "publication", value: pub, allowEmpty: false)
                entityDraft.set(for: "pubTime", value: pubTime, allowEmpty: false)
                entityDraft.set(for: "pubType", value: pubType, allowEmpty: false)

                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.cvfError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.cvfError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }
}
