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
    func fetch(for: PaperEntity?, enable: Bool) -> AnyPublisher<PaperEntity?, Error>
    func fetch(arxiv entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error>
    func fetch(doi entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error>
    func fetch(dblp entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error>
    func fetch(dblpVenue entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error>
}

struct RealWebRepository: WebRepository {
    func fetch(for entity: PaperEntity?, enable: Bool) -> AnyPublisher<PaperEntity?, Error> {
        guard entity != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        if enable {
            return CurrentValueSubject(entity)
                .flatMap {
                    fetch(arxiv: $0)
                }
                .flatMap {
                    fetch(doi: $0)
                }
                .flatMap {
                    fetch(dblp: $0)
                }
                .eraseToAnyPublisher()
        } else {
            return CurrentValueSubject(entity)
                .eraseToAnyPublisher()
        }
    }

    func fetch(arxiv entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
        var arxivID = entity!.arxiv ?? ""

        guard !arxivID.isEmpty else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        if arxivID.starts(with: "arXiv:") {
            arxivID = formatString(arxivID, removeNewline: true, removeWhite: true, removeStr: "arXiv:")!
        }
        let fetchURL = "https://export.arxiv.org/api/query?id_list=\(arxivID)"
        let headers: HTTPHeaders = ["accept-encoding": "UTF-32BE"]

        func parseResponse(xmlString: String?, entity: PaperEntity) -> AnyPublisher<PaperEntity?, Error> {
            guard xmlString != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

            do {
                let xml = try XML.parse(xmlString!)

                // Title
                let title = xml["feed"]["entry"]["title"].text ?? ""
                // Authors
                let authorList = xml["feed"]["entry"]["author"].all ?? []
                let authors = authorList.map { author in author.childElements[0].text ?? "" }.joined(separator: ", ")
                // PubTime
                let pubDate = xml["feed"]["entry"]["published"].text
                let pubTime = pubDate == nil ? "" : String(pubDate![...pubDate!.index(pubDate!.startIndex, offsetBy: 3)])

                entity.setValue(for: "title", value: title, allowEmpty: false)
                entity.setValue(for: "authors", value: authors, allowEmpty: false)
                entity.setValue(for: "pubTime", value: pubTime, allowEmpty: false)
                entity.setValue(for: "pubType", value: 0, allowEmpty: false)
                entity.setValue(for: "publication", value: "arXiv", allowEmpty: false)
            } catch {
                print("[Error] invalid arxiv response.")
            }
            return CurrentValueSubject(entity)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL, headers: headers)
            .publishString()
            .flatMap {
                parseResponse(xmlString: $0.value, entity: entity!)
            }
            .eraseToAnyPublisher()
    }

    func fetch(doi entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
        var doiID = entity!.doi ?? ""

        guard !doiID.isEmpty else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        doiID = formatString(doiID, removeNewline: true, removeWhite: true)!

        let fetchURL = "https://dx.doi.org/\(doiID)"
        let headers: HTTPHeaders = ["Accept": "application/json"]

        struct DoiResponseAuthor: Decodable {
            let given: String
            let family: String
        }
        struct DoiResponse: Decodable {
            let type: String
            let title: String
            let author: [DoiResponseAuthor]
            let container_title: String
            let published: [String: [[Int]]]
        }

        func parseResponse(doiResponse: String?, entity: PaperEntity) -> AnyPublisher<PaperEntity?, Error> {
            guard doiResponse != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

            let jsonData = doiResponse!.replacingOccurrences(of: "container-title", with: "container_title").data(using: .utf8)!
            let doiData: DoiResponse? = try? JSONDecoder().decode(DoiResponse.self, from: jsonData)

            if let doi = doiData {
                // Title
                let title = doi.title
                // Authors
                let authors = doi.author.map { author in "\(author.given) \(author.family)" }.joined(separator: ", ")
                // PubTime
                let pubTime = "\(doi.published["date-parts"]![0][0])"
                // Publication
                let pub = doi.container_title
                // Type
                var pubType: Int
                if doi.type == "proceedings-article" {
                    pubType = 1
                } else if doi.type == "journal-article" {
                    pubType = 0
                } else {
                    pubType = 2
                }

                entity.setValue(for: "title", value: title, allowEmpty: false)
                entity.setValue(for: "authors", value: authors, allowEmpty: false)
                entity.setValue(for: "publication", value: pub, allowEmpty: false)
                entity.setValue(for: "pubTime", value: pubTime, allowEmpty: false)
                entity.setValue(for: "pubType", value: pubType, allowEmpty: false)
            }

            return CurrentValueSubject(entity)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL, headers: headers)
            .publishString()
            .flatMap {
                parseResponse(doiResponse: $0.value, entity: entity!)
            }
            .eraseToAnyPublisher()
    }

    func fetch(dblp entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
        let dblpQuery = entity!.title

        guard !dblpQuery.isEmpty else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        var fetchURL = "https://dblp.org/search/publ/api?q=\(dblpQuery)&format=json"
        fetchURL = fetchURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        func parseResponse(dblpResponse: String?, entity: PaperEntity) -> AnyPublisher<PaperEntity?, Error> {
            guard dblpResponse != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

            let jsonData = dblpResponse!.data(using: .utf8)!

            do {
                let dblpData = try JSON(data: jsonData)

                var title: String
                var authors: String
                var pubTime: String
                var pubType: Int
                var pubKey: String?

                if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                    let hits = dblpData["result"]["hits"]["hit"]

                    for hit in hits {
                        let paperInfo = hit.1["info"]
                        let hitTitle = paperInfo["title"].stringValue
                        // TODO: Keep only Eng characters

                        if formatString(hitTitle, removeSymbol: true, lowercased: true) != formatString(entity.title, removeSymbol: true, lowercased: true) {
                            continue
                        } else {
                            // Title
                            title = hitTitle
                            // Authors
                            var authorsList = [String]()
                            paperInfo["authors"]["author"].forEach { author in
                                authorsList.append(author.1["text"].stringValue.trimmingCharacters(in: CharacterSet.letters.inverted))
                            }
                            authors = String(authorsList.joined(separator: ", "))

                            pubTime = paperInfo["year"].stringValue
                            pubType = [
                                "Conference and Workshop Papers": 1,
                                "Journal Articles": 0,
                            ][paperInfo["type"].stringValue] ?? 2
                            pubKey = paperInfo["key"].stringValue.components(separatedBy: "/")[...1].joined(separator: "/")

                            entity.setValue(for: "title", value: title, allowEmpty: false)
                            entity.setValue(for: "authors", value: authors, allowEmpty: false)
                            entity.setValue(for: "pubTime", value: pubTime, allowEmpty: false)
                            entity.setValue(for: "pubType", value: pubType, allowEmpty: false)

                            // Do not allow replace with "CoRR"
                            if pubKey != "journals/corr" {
                                entity.setValue(for: "publication", value: pubKey, allowEmpty: false)
                            }

                            break
                        }
                    }
                }

                if pubKey != nil, pubKey != "journals/corr" {
                    return CurrentValueSubject(entity)
                        .flatMap {
                            fetch(dblpVenue: $0)
                        }
                        .eraseToAnyPublisher()
                } else {
                    return CurrentValueSubject(entity)
                        .eraseToAnyPublisher()
                }
            } catch {
                print("[Error] invalid dblp response.")
                return CurrentValueSubject(entity)
                    .eraseToAnyPublisher()
            }
        }

        return AF.request(fetchURL)
            .publishString()
            .flatMap {
                parseResponse(dblpResponse: $0.value, entity: entity!)
            }
            .eraseToAnyPublisher()
    }

    func fetch(dblpVenue entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
        var fetchURL = "https://dblp.org/search/venue/api?q=\(entity!.publication)&format=json"
        fetchURL = fetchURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        func parseResponse(dblpResponse: String?, entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
            guard dblpResponse != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

            do {
                let jsonData = dblpResponse!.data(using: .utf8)!
                let dblpData = try JSON(data: jsonData)

                if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                    let hit = dblpData["result"]["hits"]["hit"].first!
                    let venueInfo = hit.1["info"]
                    let venue = venueInfo["venue"].stringValue
                    entity!.setValue(for: "publication", value: venue, allowEmpty: false)
                }

                return CurrentValueSubject(entity)
                    .eraseToAnyPublisher()
            } catch {
                print("[Error] invalid dblp venue response.")
                return CurrentValueSubject(entity)
                    .eraseToAnyPublisher()
            }
        }

        return AF.request(fetchURL)
            .publishString()
            .flatMap {
                parseResponse(dblpResponse: $0.value, entity: entity!)
            }
            .eraseToAnyPublisher()
    }
}
