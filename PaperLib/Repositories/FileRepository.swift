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
    func read(from url: URL) -> AnyPublisher<PaperEntity?, Error>
    func read(pdfUrl: URL) -> AnyPublisher<PaperEntity?, Error>
    
    func move(for entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error>
    func move(for entity: EditPaperEntity?) -> AnyPublisher<EditPaperEntity?, Error>
    func move(for entities: [PaperEntity?]) -> AnyPublisher<[PaperEntity?], Error>
    func move(for entities: [EditPaperEntity?]) -> AnyPublisher<[EditPaperEntity?], Error>
    
    func remove(for entity: PaperEntity?) -> AnyPublisher<Bool, Error>
    func remove(for entities: Results<PaperEntity>) -> AnyPublisher<[Bool], Error>
}

struct RealFileDBRepository: FileRepository {
    
    let queue: DispatchQueue = .init(label: "fileQueue")
    let cancelBag: CancelBag = .init()

    func read(from url: URL) -> AnyPublisher<PaperEntity?, Error> {
        if url.pathExtension == "pdf" {
            return read(pdfUrl: url)
        } else {
            return CurrentValueSubject(nil).eraseToAnyPublisher()
        }
    }

    // MARK: - PDF

    func read(pdfUrl: URL) -> AnyPublisher<PaperEntity?, Error> {
        return Future<PaperEntity?, Error> { promise in
            queue.async {
                let document = PDFDocument(url: pdfUrl)
                
                if let pdf = document {
                    let entity = PaperEntity()
                    entity.mainURL = pdfUrl.absoluteString
                    
                    if (UserDefaults.standard.bool(forKey: "allowFetchPDFMeta")) {
                        let title = pdf.documentAttributes?[PDFDocumentAttribute.titleAttribute]
                        let authors = pdf.documentAttributes?[PDFDocumentAttribute.authorAttribute]
                        entity.setValue(for: "title", value: title as? String ?? "", allowEmpty: false)
                        entity.setValue(for: "authors", value: authors as? String ?? "", allowEmpty: false)
                    }
                    let doi = extractDOI(pdf)
                    entity.setValue(for: "doi", value: doi, allowEmpty: false)
                    let arxivID = extractArxiv(pdf)
                    entity.setValue(for: "arxiv", value: arxivID, allowEmpty: false)
                    print(entity)
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
                    print("Cannot move \(filePath.path)")
                    promise(.success(false))
                }
            } else {
                promise(.success(false))
            }
        }
        .eraseToAnyPublisher()
    }

    func move(for entity: PaperEntity?) -> AnyPublisher<PaperEntity?, Error> {
        guard entity != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        let dbRoot = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""

        let targetFileName = entity!.title.replaceCharactersFromSet(in: engLetterandWhiteCharacterSet.inverted, replacementString: "")
            .replacingOccurrences(of: " ", with: "_") + "_\(entity!.id)"

        return Future<PaperEntity?, Error> { promise in
            var sourcePaths = Array(entity!.supURLs)
            var targetPaths = Array<String>.init()

            for (i, _) in sourcePaths.enumerated() {
                targetPaths.append(targetFileName + "_sup\(i)")
            }
            
            sourcePaths.insert(entity!.mainURL, at: 0)
            targetPaths.insert(targetFileName + "_main", at: 0)

            var targetURLs = Array<URL>.init()

            var publisher = CurrentValueSubject<Bool, Error>(true).eraseToAnyPublisher()

            for (sourcePath, targetPath) in zip(sourcePaths, targetPaths) {
                let sourceURL = URL(string: sourcePath)
                let targetURL = URL(string: dbRoot)?.appendingPathComponent("\(targetPath)").appendingPathExtension(sourceURL?.pathExtension ?? "")

                targetURLs.append(targetURL!)

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
                    entity!.mainURL = targetURLs.first!.absoluteString
                    entity!.supURLs.removeAll()
                    targetURLs[1...].forEach { supPath in
                        entity!.supURLs.append(supPath.absoluteString)
                    }
                    promise(.success(entity))
                } else {
                    promise(.success(nil))
                }

            }).store(in: cancelBag)
        }
        .eraseToAnyPublisher()
    }

    func move(for entities: [PaperEntity?]) -> AnyPublisher<[PaperEntity?], Error> {
        var publisherList: [AnyPublisher<PaperEntity?, Error>] = .init()

        entities.forEach { entity in
            let publisher = move(for: entity)
            publisherList.append(publisher)
        }

        return Publishers.MergeMany(publisherList).collect().eraseToAnyPublisher()
    }

    func move(for entity: EditPaperEntity?) -> AnyPublisher<EditPaperEntity?, Error> {
        guard entity != nil else { return CurrentValueSubject(entity).eraseToAnyPublisher() }

        let dbRoot = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""

        let targetFileName = entity!.title.replaceCharactersFromSet(in: engLetterandWhiteCharacterSet.inverted, replacementString: "")
            .replacingOccurrences(of: " ", with: "_") + "_\(entity!.id)"

        return Future<EditPaperEntity?, Error> { promise in
            var sourcePaths = Array(entity!.supURLs)
            var targetPaths = Array<String>.init()

            for (i, _) in sourcePaths.enumerated() {
                targetPaths.append(targetFileName + "_sup\(i)")
            }
            targetPaths.insert(targetFileName + "_main", at: 0)
            sourcePaths.insert(entity!.mainURL, at: 0)

            var targetURLs = Array<URL>.init()

            var publisher = CurrentValueSubject<Bool, Error>(true).eraseToAnyPublisher()

            for (sourcePath, targetPath) in zip(sourcePaths, targetPaths) {
                let sourceURL = URL(string: sourcePath)
                let targetURL = URL(string: dbRoot)?.appendingPathComponent("\(targetPath)").appendingPathExtension(sourceURL?.pathExtension ?? "")

                targetURLs.append(targetURL!)

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
                    entity!.mainURL = targetURLs.first!.absoluteString
                    entity!.supURLs.removeAll()
                    targetURLs[1...].forEach { supPath in
                        entity!.supURLs.append(supPath.absoluteString)
                    }
                    promise(.success(entity))
                } else {
                    promise(.success(nil))
                }

            }).store(in: cancelBag)
        }
        .eraseToAnyPublisher()
    }

    func move(for entities: [EditPaperEntity?]) -> AnyPublisher<[EditPaperEntity?], Error> {
        var publisherList: [AnyPublisher<EditPaperEntity?, Error>] = .init()

        entities.forEach { entity in
            let publisher = move(for: entity)
            publisherList.append(publisher)
        }

        return Publishers.MergeMany(publisherList).collect().eraseToAnyPublisher()
    }

    func remove(for entity: PaperEntity?) -> AnyPublisher<Bool, Error> {
        guard entity != nil else { return CurrentValueSubject(true).eraseToAnyPublisher() }

        return Future<Bool, Error> { promise in

            var filePaths = Array(entity!.supURLs)
            filePaths.insert(entity!.mainURL, at: 0)

            var publisher = CurrentValueSubject<Bool, Error>(false).eraseToAnyPublisher()

            filePaths.forEach { filePath in
                let fileURL = URL(string: filePath)
                
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

    func remove(for entities: Results<PaperEntity>) -> AnyPublisher<[Bool], Error> {
        var publisherList: [AnyPublisher<Bool, Error>] = Array()
        entities.forEach { entity in
            publisherList.append(remove(for: entity))
        }
        return Publishers.MergeMany(publisherList)
            .collect()
            .eraseToAnyPublisher()
    }

}
