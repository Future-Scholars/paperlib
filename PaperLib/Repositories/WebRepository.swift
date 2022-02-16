//
//  WebRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Alamofire
import Combine
import CoreData
import SwiftyJSON
import SwiftyXMLParser

protocol WebRepository {
    func apiVersion() -> AnyPublisher<DataResponse<String, AFError>, Never>

    func scrape(for: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError>
}

enum WebError: Error {
    case arXivError(entityDraft: PaperEntityDraft)
    case doiError(entityDraft: PaperEntityDraft)
    case dblpError(entityDraft: PaperEntityDraft)
    case ieeeError(entityDraft: PaperEntityDraft)
    case titleExtractorError(entityDraft: PaperEntityDraft)
}

struct RealWebRepository: WebRepository {
    let scraperList: [Scraper] = [
        TitleExtractorScraper(),
        ArXivScraper(),
        DOIScraper(),
        DBLPScraper(),
        DBLPbyTimeScraper(offset: 0),
        DBLPbyTimeScraper(offset: 1),
        DBLPVenueScraper(),
        IEEEScraper()
    ]

    func apiVersion() -> AnyPublisher<DataResponse<String, AFError>, Never> {
        let versionURL = "https://paperlib.geoch.top/api/version"

        return AF.request(versionURL)
            .publishString()
            .eraseToAnyPublisher()
    }

    func handelScraperErrors(error: WebError) -> PaperEntityDraft {
        switch error {
        case .arXivError(entityDraft: let entityDraft): do {
            print("[!] ArXiv scraper error")
            return entityDraft
        }
        case .doiError(entityDraft: let entityDraft): do {
            print("[!] DOI scraper error")
            return entityDraft
        }
        case .dblpError(entityDraft: let entityDraft): do {
            print("[!] DBLP scraper error")
            return entityDraft
        }
        case .ieeeError(entityDraft: let entityDraft): do {
            print("[!] IEEE scraper error")
            return entityDraft
        }
        case .titleExtractorError(entityDraft: let entityDraft): do {
            print("[!] Title Extractor scraper error")
            return entityDraft
        }
        }
    }

    func scrape(for entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        var scrapePublisher = Just<PaperEntityDraft>
            .withErrorType(entityDraft, WebError.self)
            .eraseToAnyPublisher()

        for scraper in scraperList {
            scrapePublisher = scrapePublisher.flatMap {entityDraft in
                scraper.scrape(entityDraft: entityDraft)
                    .catch { error -> AnyPublisher<PaperEntityDraft, WebError> in
                        let entityDraft = handelScraperErrors(error: error)
                        return Just<PaperEntityDraft>
                            .withErrorType(entityDraft, WebError.self)
                            .eraseToAnyPublisher()
                    }
            }
            .eraseToAnyPublisher()
        }

        return scrapePublisher.eraseToAnyPublisher()
    }

}
