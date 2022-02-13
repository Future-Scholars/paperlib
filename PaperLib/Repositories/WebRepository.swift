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
    func fetch(for: PaperEntityDraft, enable: Bool) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(arxiv entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(doi entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(ieee entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(dblp entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(dblpWithTime entity: PaperEntityDraft, offset: Int) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(dblpVenue entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
    func fetch(titleExtractor entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error>
}

struct RealWebRepository: WebRepository {

    func apiVersion() -> AnyPublisher<DataResponse<String, AFError>, Never> {
        let versionURL = "https://paperlib.geoch.top/api/version"

        return AF.request(versionURL)
            .publishString()
            .eraseToAnyPublisher()
    }

    func fetch(for entity: PaperEntityDraft, enable: Bool) -> AnyPublisher<PaperEntityDraft, Error> {
        if enable {
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .flatMap {
                    fetch(arxiv: $0)
                }
                .flatMap {
                    fetch(doi: $0)
                }
                .flatMap {
                    fetch(titleExtractor: $0)
                }
                .flatMap {
                    fetch(dblp: $0)
                }
                .flatMap {
                    fetch(dblpWithTime: $0, offset: 1)
                }
                .flatMap {
                    fetch(dblpWithTime: $0, offset: 0)
                }
                .flatMap {
                    fetch(ieee: $0)
                }
                .eraseToAnyPublisher()
        } else {
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }
    }

    func fetch(arxiv entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        var arxivID = entity.arxiv

        guard !arxivID.isEmpty else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        if arxivID.starts(with: "arXiv:") {
            arxivID = formatString(arxivID, removeNewline: true, removeWhite: true, removeStr: "arXiv:")!
        }
        let fetchURL = "https://export.arxiv.org/api/query?id_list=\(arxivID)"
        let headers: HTTPHeaders = ["accept-encoding": "UTF-32BE"]

        func parseResponse(xmlString: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
            guard xmlString != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

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

                entity.set(for: "title", value: title, allowEmpty: false)
                entity.set(for: "authors", value: authors, allowEmpty: false)
                entity.set(for: "pubTime", value: pubTime, allowEmpty: false)
                entity.set(for: "pubType", value: "Journal", allowEmpty: false)
                entity.set(for: "publication", value: "arXiv", allowEmpty: false)
            } catch {
                print("[Error] invalid arxiv response.")
            }
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL, headers: headers)
            .publishString()
            .flatMap {
                parseResponse(xmlString: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func fetch(doi entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        var doiID = entity.doi

        guard !doiID.isEmpty else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

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

        func parseResponse(doiResponse: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
            guard doiResponse != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

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
                var pubType: String
                if doi.type == "proceedings-article" {
                    pubType = "Conference"
                } else if doi.type == "journal-article" {
                    pubType = "Journal"
                } else {
                    pubType = "Others"
                }

                entity.set(for: "title", value: title, allowEmpty: false)
                entity.set(for: "authors", value: authors, allowEmpty: false)
                entity.set(for: "publication", value: pub, allowEmpty: false)
                entity.set(for: "pubTime", value: pubTime, allowEmpty: false)
                entity.set(for: "pubType", value: pubType, allowEmpty: false)
            }

            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL, headers: headers)
            .publishString()
            .flatMap {
                parseResponse(doiResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func fetch(ieee entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        var title = entity.title
        guard !title.isEmpty && (entity.publication == "arXiv" || entity.publication.isEmpty) && !formatString(UserDefaults.standard.string(forKey: "ieeeAPIKey"))!.isEmpty
        else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        title = formatString(title, removeNewline: true)!
        title = title.replacingOccurrences(of: " ", with: "+")

        let fetchURL = "http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=\(formatString(UserDefaults.standard.string(forKey: "ieeeAPIKey"))!)&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=\(title)"
        let headers: HTTPHeaders = ["Accept": "application/json"]

        func parseResponse(ieeeResponse: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
            guard ieeeResponse != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

            let jsonData = ieeeResponse!.data(using: .utf8)!

            do {
                let ieeeData = try JSON(data: jsonData)
                var title: String
                var authors: String
                var pubTime: String
                var pubType: String
                var publication: String

                if ieeeData["total_records"] > 0 {

                    let hits = ieeeData["articles"]

                    for hit in hits {
                        let hitTitle = hit.1["title"].stringValue
                        var plainHitTitle = hit.1["title"].stringValue
                        plainHitTitle = formatString(plainHitTitle, removeStr: "&amp")!
                        plainHitTitle = formatString(plainHitTitle, removeSymbol: true, lowercased: true)!

                        var existTitle = formatString(entity.title, removeStr: "&amp")!
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

                            entity.set(for: "title", value: title, allowEmpty: false)
                            entity.set(for: "authors", value: authors, allowEmpty: false)
                            entity.set(for: "pubTime", value: pubTime, allowEmpty: false)
                            entity.set(for: "pubType", value: pubType, allowEmpty: false)
                            entity.set(for: "publication", value: publication, allowEmpty: false)

                            break
                        }
                    }
                }
            } catch {
                print("[Error] invalid ieee response.")
            }

            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL, headers: headers)
            .publishString()
            .flatMap {
                parseResponse(ieeeResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func _parseDBLPResponse(dblpResponse: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        guard dblpResponse != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        let jsonData = dblpResponse!.data(using: .utf8)!

        do {
            let dblpData = try JSON(data: jsonData)
            var title: String
            var authors: String
            var pubTime: String
            var pubType: String
            var pubKey: String?

            if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                let hits = dblpData["result"]["hits"]["hit"]

                for hit in hits {
                    let paperInfo = hit.1["info"]
                    let hitTitle = paperInfo["title"].stringValue
                    var plainHitTitle = paperInfo["title"].stringValue
                    plainHitTitle = formatString(plainHitTitle, removeStr: "&amp")!
                    plainHitTitle = formatString(plainHitTitle, removeSymbol: true, lowercased: true)!

                    var existTitle = formatString(entity.title, removeStr: "&amp")!
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
                        pubKey = paperInfo["key"].stringValue.components(separatedBy: "/")[...1].joined(separator: "/")

                        // Do not allow response of "CoRR"
                        if pubKey != "journals/corr" {
                            entity.set(for: "title", value: title, allowEmpty: false)
                            entity.set(for: "authors", value: authors, allowEmpty: false)
                            entity.set(for: "pubTime", value: pubTime, allowEmpty: false)
                            entity.set(for: "pubType", value: pubType, allowEmpty: false)

                            entity.set(for: "publication", value: pubKey, allowEmpty: false)

                            break
                        }

                    }
                }
            }

            if pubKey != nil, pubKey != "journals/corr" {
                return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                    .flatMap {
                        fetch(dblpVenue: $0)
                    }
                    .eraseToAnyPublisher()
            } else {
                return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                    .eraseToAnyPublisher()
            }
        } catch {
            print("[Error] invalid dblp response.")
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }
    }

    func fetch(dblp entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        var dblpQuery = formatString(entity.title, removeStr: "&amp")!
        dblpQuery = formatString(dblpQuery, removeStr: "&")!

        guard !dblpQuery.isEmpty else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        var fetchURL = "https://dblp.org/search/publ/api?q=\(dblpQuery)&format=json"
        fetchURL = fetchURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        return AF.request(fetchURL)
            .publishString()
            .flatMap {
                _parseDBLPResponse(dblpResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func fetch(dblpWithTime entity: PaperEntityDraft, offset: Int) -> AnyPublisher<PaperEntityDraft, Error> {
        let year = Int(entity.pubTime)
        guard (entity.publication.isEmpty || entity.publication == "arXiv") && year != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        var dblpQuery = formatString(entity.title, removeStr: "&amp")!
        dblpQuery = formatString(dblpQuery, removeStr: "&")! + " " + "year:\(year! + offset)"

        guard !dblpQuery.isEmpty else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        var fetchURL = "https://dblp.org/search/publ/api?q=\(dblpQuery)&format=json"
        fetchURL = fetchURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        return AF.request(fetchURL)
            .publishString()
            .flatMap {
                _parseDBLPResponse(dblpResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func fetch(dblpVenue entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        var fetchURL = "https://dblp.org/search/venue/api?q=\(entity.publication)&format=json"
        fetchURL = fetchURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        func parseResponse(dblpResponse: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
            guard dblpResponse != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

            do {
                let jsonData = dblpResponse!.data(using: .utf8)!
                let dblpData = try JSON(data: jsonData)

                if dblpData["result"]["hits"]["@sent"].intValue > 0 {
                    let hit = dblpData["result"]["hits"]["hit"].first!
                    let venueInfo = hit.1["info"]
                    let venue = venueInfo["venue"].stringValue
                    entity.set(for: "publication", value: venue, allowEmpty: false)
                }
            } catch {
                print("[Error] invalid dblp venue response.")
            }

            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        return AF.request(fetchURL)
            .publishString()
            .flatMap {
                parseResponse(dblpResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

    func fetch(titleExtractor entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
        guard entity.title.isEmpty && formatString(entity.arxiv)!.isEmpty && formatString(entity.doi)!.isEmpty
        else {
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher()
        }

        let fileURL = URL(string: entity.mainURL)
        guard fileURL != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

        var data: Data
        do {
            data = try Data(contentsOf: fileURL!)
        } catch let err {
            print(err)
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        func parseResponse(titleExtractorResponse: String?, entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, Error> {
            guard titleExtractorResponse != nil else { return Just<PaperEntityDraft>.withErrorType(entity, Error.self).eraseToAnyPublisher() }

            let jsonData = titleExtractorResponse!.data(using: .utf8)!

            do {
                let titleData = try JSON(data: jsonData)
                entity.set(for: "title", value: titleData["title"].stringValue, allowEmpty: false)
            } catch {
                print("[Error] invalid dblp response.")
            }
            return Just<PaperEntityDraft>.withErrorType(entity, Error.self)
                .eraseToAnyPublisher()
        }

        return AF.upload(
            multipartFormData: { multipartFormData in
                multipartFormData.append(data, withName: "file", fileName: "file", mimeType: "application/pdf")
            },
            to: "https://paperlib.geoch.top/api/files/upload/"
        )
            .publishString()
            .flatMap {
                parseResponse(titleExtractorResponse: $0.value, entity: entity)
            }
            .eraseToAnyPublisher()
    }

}
