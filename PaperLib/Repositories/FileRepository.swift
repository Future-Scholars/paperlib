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

protocol FileRepository {
    func read(url: URL) -> PaperEntity?
    func read(from url: URL) -> AnyPublisher<PaperEntity?, Error>
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
        CurrentValueSubject(read(url: url))
            .eraseToAnyPublisher()
    }

    func read(url: URL) -> PaperEntity? {
        if url.pathExtension == "pdf" {
            return readPDF(url: url)
        } else {
            return nil
        }
    }

    // MARK: - PDF

    func readPDF(url: URL) -> PaperEntity? {
        let document = PDFDocument(url: url) ?? nil
        guard document != nil else {
            return nil
        }
        let entity = PaperEntity()

        if (UserDefaults.standard.bool(forKey: "allowFetchPDFMeta")) {
            let title = document?.documentAttributes?[PDFDocumentAttribute.titleAttribute]
            let authors = document?.documentAttributes?[PDFDocumentAttribute.authorAttribute]
            entity.setValue(for: "title", value: title as? String ?? "", allowEmpty: false)
            entity.setValue(for: "authors", value: authors as? String ?? "", allowEmpty: false)
        }
        
        entity.setValue(for: "doi", value: extractDOI(document: document ?? nil), allowEmpty: false)
        entity.setValue(for: "arxiv", value: extractArxiv(document: document ?? nil), allowEmpty: false)
        entity.mainURL = url.absoluteString

        return entity
    }

    func extractDOI(document: PDFDocument?) -> String? {
        var doi: String?
        let pattern = "(?:(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%\"#? ])\\S)+))"

        // From subject metadata
        let subject = document?.documentAttributes?[PDFDocumentAttribute.subjectAttribute] ?? ""
        let subjectMatch = matches(for: pattern, in: subject as! String)
        doi = subjectMatch.first ?? nil

        if doi == nil {
            // From fulltext
            let page = document?.page(at: 0)
            let pageContent = page?.attributedString

            let fulltextMatch = matches(for: pattern, in: pageContent?.string ?? "")
            doi = fulltextMatch.first ?? nil
        }
        return doi
    }

    func extractArxiv(document: PDFDocument?) -> String? {
        var arxiv: String?
        let pattern = "arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?"

        // From subject metadata
        let subject = document?.documentAttributes?[PDFDocumentAttribute.subjectAttribute] ?? ""
        let subjectMatch = matches(for: pattern, in: subject as! String)
        arxiv = subjectMatch.first ?? nil

        if arxiv == nil {
            // From fulltext
            let page = document?.page(at: 0)
            let pageContent = page?.attributedString

            let fulltextMatch = matches(for: pattern, in: pageContent?.string ?? "")
            arxiv = fulltextMatch.first ?? nil
        }
        return arxiv
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
                    try FileManager.default.copyItem(atPath: sourcePath.path, toPath: targetPath.path)
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
            if entity!.mainURL == nil {
                promise(.success(nil))
            }

            var sourcePaths = Array(entity!.supURLs)
            var targetPaths = Array<String>.init()

            for (i, _) in sourcePaths.enumerated() {
                targetPaths.append(targetFileName + "_sup\(i)")
            }
            targetPaths.insert(targetFileName + "_main", at: 0)

            sourcePaths.insert(entity!.mainURL!, at: 0)

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
                    entity!.mainURL = targetURLs.first?.absoluteString
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
            if entity!.mainURL == nil {
                promise(.success(nil))
            }

            var sourcePaths = Array(entity!.supURLs)
            var targetPaths = Array<String>.init()

            for (i, _) in sourcePaths.enumerated() {
                targetPaths.append(targetFileName + "_sup\(i)")
            }
            targetPaths.insert(targetFileName + "_main", at: 0)

            sourcePaths.insert(entity!.mainURL!, at: 0)

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
                    entity!.mainURL = targetURLs.first?.absoluteString
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
            filePaths.insert(entity!.mainURL!, at: 0)

            var publisher = CurrentValueSubject<Bool, Error>(false).eraseToAnyPublisher()

            filePaths.forEach { filePath in
                let fileURL = URL(string: filePath)

                publisher = publisher.flatMap { _ -> AnyPublisher<Bool, Error> in
                    _remove(for: fileURL!)
                }.eraseToAnyPublisher()
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
