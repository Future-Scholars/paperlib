//
//  Scraper.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Alamofire
import Combine

protocol Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool)
    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError>
    func scrape(entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError>
    func scrapeImpl(entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError>
}

extension Scraper {
    func scrape(entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        return scrapeImpl(entityDraft: entityDraft)
    }

    func scrapeImpl(entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        let (scrapeURL, headers, enable) = preProcess(entityDraft: entityDraft)
        if enable {
            return AF.request(scrapeURL, headers: headers)
                .publishString()
                .flatMap {
                    parsingProcess(response: $0.value, entityDraft: entityDraft)
                }
                .eraseToAnyPublisher()
        } else {
            return Just<PaperEntityDraft>
                .withErrorType(entityDraft, WebError.self)
                .eraseToAnyPublisher()
        }
    }
}
