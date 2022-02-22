//
//  TitleExtractor.swift
//  PaperLib
//
//  Created by GeoffreyChen on 15/02/2022.
//

import Foundation
import Combine
import Alamofire
import SwiftyJSON

struct TitleExtractorScraper: Scraper {
    func preProcess(entityDraft: PaperEntityDraft) -> (String, HTTPHeaders, Bool) {
        let enable = entityDraft.title.isEmpty && formatString(entityDraft.arxiv)!.isEmpty && formatString(entityDraft.doi)!.isEmpty && FileManager.default.fileExists(atPath: entityDraft.mainURL) && UserDefaults.standard.bool(forKey: "teScraper")

        let scrapeURL = "https://paperlib.geoch.top/api/files/upload/"
        let headers: HTTPHeaders = []

        return (scrapeURL, headers, enable)
    }

    func parsingProcess(response: String?, entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        if let response = response {
            do {
                let jsonData = response.data(using: .utf8)!
                let titleData = try JSON(data: jsonData)
                entityDraft.set(for: "title", value: titleData["title"].stringValue, allowEmpty: false)

                return Just<PaperEntityDraft>
                    .withErrorType(entityDraft, WebError.self)
                    .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.titleExtractorError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Fail(error: WebError.titleExtractorError(entityDraft: entityDraft)).eraseToAnyPublisher()
        }

    }

    func readFile(entityDraft: PaperEntityDraft) throws -> Data {
        let fileURL = URL(string: entityDraft.mainURL)
        var data: Data
        data = try Data(contentsOf: fileURL!)
        return data
    }

    func scrapeImpl(entityDraft: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, WebError> {
        let (scrapeURL, _, enable) = preProcess(entityDraft: entityDraft)

        if enable {
            do {
                let data = try readFile(entityDraft: entityDraft)

                return AF.upload(
                        multipartFormData: { multipartFormData in
                            multipartFormData.append(data, withName: "file", fileName: "file", mimeType: "application/pdf")
                        },
                        to: scrapeURL
                    )
                        .publishString()
                        .flatMap {
                            parsingProcess(response: $0.value, entityDraft: entityDraft)
                        }
                        .eraseToAnyPublisher()
            } catch {
                return Fail(error: WebError.titleExtractorError(entityDraft: entityDraft)).eraseToAnyPublisher()
            }
        } else {
            return Just<PaperEntityDraft>
                .withErrorType(entityDraft, WebError.self)
                .eraseToAnyPublisher()
        }
    }

}
