//
//  ArXiv.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyXMLParser

struct ArXivScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = !entityDraft.arxiv.isEmpty

        var arxivID = entityDraft.arxiv
        if arxivID.starts(with: "arXiv:") {
            arxivID = formatString(arxivID, removeNewline: true, removeWhite: true, removeStr: "arXiv:")!
        }
        let scrapeURL = "https://export.arxiv.org/api/query?id_list=\(arxivID)"
        let headers: HTTPHeaders = ["accept-encoding": "UTF-32BE"]

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {
                let xml = try XML.parse(response)

                // Title
                let title = xml["feed"]["entry"]["title"].text ?? ""
                // Authors
                let authorList = xml["feed"]["entry"]["author"].all ?? []
                let authors = authorList.map { author in author.childElements[0].text ?? "" }.joined(separator: ", ")
                // PubTime
                let pubDate = xml["feed"]["entry"]["published"].text
                let pubTime = pubDate == nil ? "" : String(pubDate![...pubDate!.index(pubDate!.startIndex, offsetBy: 3)])

                entityDraft.set(for: "title", value: title, allowEmpty: false)
                entityDraft.set(for: "authors", value: authors, allowEmpty: false)
                entityDraft.set(for: "pubTime", value: pubTime, allowEmpty: false)
                entityDraft.set(for: "pubType", value: "Journal", allowEmpty: false)
                entityDraft.set(for: "publication", value: "arXiv", allowEmpty: false)
                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.arXivError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.arXivError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }
}
