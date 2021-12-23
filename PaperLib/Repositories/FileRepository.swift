//
//  FileRepository.swift
//  PaperLib
//
//  Created by GeoffreyChen on 01/12/2021.
//

import Combine
import CoreData
import PDFKit
import RealmSwift
import Alamofire


protocol FileRepository {
    func read(from url: URL) -> AnyPublisher<PaperEntityDraft?, Error>
    func read(pdfUrl: URL) -> AnyPublisher<PaperEntityDraft?, Error>
    
    func move(for entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft?, Error>
    func move(for entities: [PaperEntityDraft]) -> AnyPublisher<[PaperEntityDraft?], Error>
    
    func remove(for entity: PaperEntity) -> AnyPublisher<Bool, Error>
    func remove(for entities: [PaperEntity]) -> AnyPublisher<[Bool], Error>
    func remove(for entity: PaperEntityDraft) -> AnyPublisher<Bool, Error>
    func remove(for entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], Error>
    func download(url: URL) -> AnyPublisher<URL?, Error>
}

struct RealFileDBRepository: FileRepository {
    
    let queue: DispatchQueue = .init(label: "fileQueue")
    let cancelBag: CancelBag = .init()

    func read(from url: URL) -> AnyPublisher<PaperEntityDraft?, Error> {
        if url.pathExtension == "pdf" {
            return read(pdfUrl: url)
        } else {
            return CurrentValueSubject(nil).eraseToAnyPublisher()
        }
    }

    // MARK: - PDF

    func read(pdfUrl: URL) -> AnyPublisher<PaperEntityDraft?, Error> {
        return Future<PaperEntityDraft?, Error> { promise in
            queue.async {
                let document = PDFDocument(url: pdfUrl)
                
                if let pdf = document {
                    let entity = PaperEntityDraft()
                    
                    entity.set(for: "mainURL", value: pdfUrl.absoluteString)
                    
                    if (UserDefaults.standard.bool(forKey: "allowFetchPDFMeta")) {
                        let title = pdf.documentAttributes?[PDFDocumentAttribute.titleAttribute]
                        let authors = pdf.documentAttributes?[PDFDocumentAttribute.authorAttribute]
                        entity.set(for: "title", value: title as? String ?? "", allowEmpty: false)
                        entity.set(for: "authors", value: authors as? String ?? "", allowEmpty: false)
                    }
                    let doi = extractDOI(pdf)
                    entity.set(for: "doi", value: doi, allowEmpty: false)
                    let arxivID = extractArxiv(pdf)
                    entity.set(for: "arxiv", value: arxivID, allowEmpty: false)
                    promise(.success(entity))
                }
                else {
                    promise(.success(nil))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func extractIdentifier(_ document: PDFDocument, pattern: String) -> String? {
        // From subject metadata
        let subject = document.documentAttributes?[PDFDocumentAttribute.subjectAttribute] ?? ""
        let subjectMatch = matches(for: pattern, in: subject as! String)
        let matchedIdentifier = subjectMatch.first

        if let identifier = matchedIdentifier {
            return identifier
        }
        
        // From fulltext
        let page = document.page(at: 0)
        let pageContent = page?.attributedString

        let fulltextMatch = matches(for: pattern, in: pageContent?.string ?? "")
        return fulltextMatch.first
        
    }
    
    func extractDOI(_ document: PDFDocument) -> String? {
        let pattern = "(?:(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%\"#? ])\\S)+))"
        return extractIdentifier(document, pattern: pattern)
    }

    func extractArxiv(_ document: PDFDocument) -> String? {
        let pattern = "arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?"
        return extractIdentifier(document, pattern: pattern)
    }

    func matches(for regex: String, in text: String) -> [String] {
        do {
            let regex = try NSRegularExpression(pattern: regex)
            let results = regex.matches(in: text, range: NSRange(text.startIndex..., in: text))
            return results.map {
                String(text[Range($0.range, in: text)!])
            }
        } catch {
            print("invalid regex: \(error.localizedDescription)")
            return []
        }
    }

    // MARK: - Move

    func constructUrl(_ path: String) -> URL? {
        if (path.starts(with: "file://")){
            return URL(string: path)
        }
        else {
            let dbRoot = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""
            var url = URL(string: dbRoot)
            url?.appendPathComponent(path)
            return url
        }
    }
    
    func _move(from sourcePath: URL, to targetPath: URL) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            if !FileManager.default.fileExists(atPath: targetPath.path) {
                do {
                    if (UserDefaults.standard.bool(forKey: "deleteSourceFile")) {
                        try FileManager.default.moveItem(atPath: sourcePath.path, toPath: targetPath.path)
                    }
                    else {
                        try FileManager.default.copyItem(atPath: sourcePath.path, toPath: targetPath.path)
                    }
                    promise(.success(true))
                } catch {
                    print("Cannot move \(sourcePath.path)")
                    promise(.success(false))
                }
            } else {
                promise(.success(true))
            }
        }
        .eraseToAnyPublisher()
    }

    func _remove(for filePath: URL) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in
            if FileManager.default.fileExists(atPath: filePath.path) {
                do {
                    try FileManager.default.removeItem(atPath: filePath.path)
                    promise(.success(true))
                } catch {
                    print("Cannot remove \(filePath.path)")
                    promise(.success(false))
                }
            } else {
                promise(.success(false))
            }
        }
        .eraseToAnyPublisher()
    }

    func move(for entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft?, Error> {
        
        let targetFileName = entity.get("title", type: String.self).replaceCharactersFromSet(in: engLetterandWhiteCharacterSet.inverted, replacementString: "")
            .replacingOccurrences(of: " ", with: "_") + "_\(entity.get("id", type: ObjectId.self))"

        return Future<PaperEntityDraft?, Error> { promise in
            var sourceURLs = Array(entity.get("supURLs", type: Array<String>.self)).map({ return self.constructUrl($0) })
            var targetURLs = Array<URL?>.init()

            for (i, sourceURL) in sourceURLs.enumerated() {
                var targetURL = self.constructUrl(targetFileName + "_sup\(i)")
                targetURL?.appendPathExtension(sourceURL?.pathExtension ?? "")
                targetURLs.append(targetURL)
            }
            
            let sourceMainURL = self.constructUrl(entity.get("mainURL", type: String.self))
            sourceURLs.insert(sourceMainURL, at: 0)
            var targetMainURL = self.constructUrl(targetFileName + "_main")
            targetMainURL?.appendPathExtension(sourceMainURL?.pathExtension ?? "")
            targetURLs.insert(targetMainURL, at: 0)

            var publisher = CurrentValueSubject<Bool, Error>(true).eraseToAnyPublisher()

            for (sourceURL, targetURL) in zip(sourceURLs, targetURLs) {
                publisher = publisher.flatMap { flag -> AnyPublisher<Bool, Error> in
                    if sourceURL == nil || targetURL == nil || !flag {
                        return CurrentValueSubject<Bool, Error>(false).eraseToAnyPublisher()
                    } else {
                        return _move(from: sourceURL!, to: targetURL!)
                    }
                }.eraseToAnyPublisher()
            }

            publisher.sink(receiveCompletion: { _ in }, receiveValue: {
                if $0 {
                    entity.set(for: "mainURL", value: targetMainURL!.lastPathComponent)
                    entity.set(for: "supURLs", value: [], allowEmpty: true)
                    entity.set(for: "supURLs", value: targetURLs[1...].map({ $0!.lastPathComponent }), allowEmpty: true)

                    promise(.success(entity))
                } else {
                    promise(.success(nil))
                }

            }).store(in: cancelBag)
        }
        .eraseToAnyPublisher()
    }

    func move(for entities: [PaperEntityDraft]) -> AnyPublisher<[PaperEntityDraft?], Error> {
        var publisherList: [AnyPublisher<PaperEntityDraft?, Error>] = .init()

        entities.forEach { entity in
            let publisher = move(for: entity)
            publisherList.append(publisher)
        }

        return Publishers.MergeMany(publisherList).collect().eraseToAnyPublisher()
    }

    func remove(for entity: PaperEntityDraft) -> AnyPublisher<Bool, Error> {
        var fileURLs = entity.get("supURLs", type: Array<String>.self).map({ return self.constructUrl($0) })
        fileURLs.insert(self.constructUrl(entity.get("mainURL", type: String.self)), at: 0)

        var publisherList: [AnyPublisher<Bool, Error>] = .init()
        fileURLs.forEach { fileURL in
            if let url = fileURL {
                publisherList.append(_remove(for: url))
            }
        }
        
        return Publishers.MergeMany(publisherList).allSatisfy({ return $0 }).eraseToAnyPublisher()
    }
    
    func remove(for entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], Error> {
        var publisherList: [AnyPublisher<Bool, Error>] = .init()
        entities.forEach { entity in
            publisherList.append(remove(for: entity))
        }
        return Publishers.MergeMany(publisherList)
            .collect()
            .eraseToAnyPublisher()
    }
    
    func remove(for entity: PaperEntity) -> AnyPublisher<Bool, Error> {
        return Future<Bool, Error> { promise in

            var fileURLs = Array(entity.supURLs).map({ return self.constructUrl($0) })
            fileURLs.insert(self.constructUrl(entity.mainURL), at: 0)

            var publisher = CurrentValueSubject<Bool, Error>(false).eraseToAnyPublisher()

            fileURLs.forEach { fileURL in
                if let url = fileURL {
                    publisher = publisher.flatMap { _ -> AnyPublisher<Bool, Error> in
                        _remove(for: url)
                    }.eraseToAnyPublisher()
                }
            }

            publisher.sink(
                receiveCompletion: { _ in },
                receiveValue: {
                    promise(.success($0))
                }
            )
            .store(in: cancelBag)
        }
        .eraseToAnyPublisher()
    }

    func remove(for entities: [PaperEntity]) -> AnyPublisher<[Bool], Error> {
        var publisherList: [AnyPublisher<Bool, Error>] = Array()
        entities.forEach { entity in
            publisherList.append(remove(for: entity))
        }
        return Publishers.MergeMany(publisherList)
            .collect()
            .eraseToAnyPublisher()
    }
    
    // MARK: - Download
    func download(url: URL) -> AnyPublisher<URL?, Error> {
        let destination = DownloadRequest.suggestedDownloadDestination(for: .downloadsDirectory)
        
        func parseResponse(downloadResponse: String?, url: URL) -> AnyPublisher<URL?, Error> {
            guard downloadResponse != nil else { return CurrentValueSubject(nil).eraseToAnyPublisher() }

            if let filename = url.pathComponents.last {
                var downloadedUrl = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
                downloadedUrl = downloadedUrl.appendingPathComponent(filename)
                return CurrentValueSubject(downloadedUrl)
                    .eraseToAnyPublisher()
            }
            else {
                return CurrentValueSubject(nil)
                    .eraseToAnyPublisher()
            }
        }
        
        
        return AF.download(url, to: destination)
            .publishString()
            .flatMap {
                parseResponse(downloadResponse: $0.value, url: url)
            }
            .eraseToAnyPublisher()
    }
}
