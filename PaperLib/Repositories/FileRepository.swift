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
    func read(from url: URL) -> AnyPublisher<PaperEntityDraft, FileError>
    func read(fromLocal url: URL) -> AnyPublisher<PaperEntityDraft, FileError>
    func read(fromWeb url: URL) -> AnyPublisher<PaperEntityDraft, FileError>
    func read(pdfURL: URL) -> AnyPublisher<PaperEntityDraft, FileError>

    func move(for entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, FileError>
    func move(for entities: [PaperEntityDraft]) -> AnyPublisher<[PaperEntityDraft], FileError>

    func remove(for filePath: String) -> AnyPublisher<Bool, FileError>
    func remove(for filePaths: [String]) -> AnyPublisher<[Bool], FileError>
    func remove(for entity: PaperEntityDraft) -> AnyPublisher<Bool, FileError>
    func remove(for entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], FileError>
    func download(url: URL) -> AnyPublisher<URL?, FileError>
}

enum FileError: Error {
    case urlFormatError
    case downloadError
    case pdfError
}

struct RealFileDBRepository: FileRepository {

    let queue: DispatchQueue = .init(label: "fileQueue")
    let cancelBag: CancelBag = .init()

    func read(from url: URL) -> AnyPublisher<PaperEntityDraft, FileError> {
        if url.scheme == "file" {
            return read(fromLocal: url)
        } else if url.scheme == "http" || url.scheme == "https" {
            return read(fromWeb: url)
        } else {
            return Fail(error: FileError.urlFormatError).eraseToAnyPublisher()
        }

    }

    func read(fromLocal url: URL) -> AnyPublisher<PaperEntityDraft, FileError> {
        if url.pathExtension == "pdf" {
            return read(pdfURL: url)
        } else {
            return Fail(error: FileError.urlFormatError).eraseToAnyPublisher()
        }
    }

    func read(fromWeb url: URL) -> AnyPublisher<PaperEntityDraft, FileError> {
        return self.download(url: url)
            .flatMap { _ in
                return self.read(fromLocal: url)
            }
            .eraseToAnyPublisher()
    }

    // MARK: - PDF

    func read(pdfURL: URL) -> AnyPublisher<PaperEntityDraft, FileError> {
        return Future<PaperEntityDraft, FileError> { promise in
            queue.async {
                let document = PDFDocument(url: pdfURL)

                if let pdf = document {
                    let entity = PaperEntityDraft()

                    entity.set(for: "mainURL", value: pdfURL.absoluteString)

                    if UserDefaults.standard.bool(forKey: "allowFetchPDFMeta") {
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
                } else {
                    promise(.failure(FileError.pdfError))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func extractIdentifier(_ document: PDFDocument, pattern: String) -> String? {
        // From subject metadata
        let subject = document.documentAttributes?[PDFDocumentAttribute.subjectAttribute] as? String ?? ""
        let subjectMatch = matches(for: pattern, in: subject)
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

    func constructURL(_ path: String) -> URL? {
        if path.starts(with: "file://") {
            return URL(string: path)
        } else {
            let dbRoot = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""
            var url = URL(string: dbRoot)
            url?.appendPathComponent(path)
            return url
        }
    }

    func _move(from sourcePath: URL, to targetPath: URL) -> Bool {
        var isDir: ObjCBool = false
        if !FileManager.default.fileExists(atPath: targetPath.path) && FileManager.default.fileExists(atPath: sourcePath.path, isDirectory: &isDir) && !isDir.boolValue {
            do {
                if UserDefaults.standard.bool(forKey: "deleteSourceFile") {
                    try FileManager.default.moveItem(atPath: sourcePath.path, toPath: targetPath.path)
                } else {
                    try FileManager.default.copyItem(atPath: sourcePath.path, toPath: targetPath.path)
                }
                return true
            } catch {
                print("Cannot move \(sourcePath.path)")
                return false
            }
        } else {
            return false
        }
    }

    func move(for entity: PaperEntityDraft) -> AnyPublisher<PaperEntityDraft, FileError> {

        let targetFileName = entity.title.replaceCharactersFromSet(in: engLetterandWhiteCharacterSet.inverted, replacementString: "")
            .replacingOccurrences(of: " ", with: "_") + "_\(entity.id)"

        // 1. Move main file.
        let sourceMainURL = self.constructURL(entity.mainURL)
        var targetMainURL = self.constructURL(targetFileName + "_main")
        targetMainURL?.appendPathExtension(sourceMainURL?.pathExtension ?? "")
        if let sourceMainURL = sourceMainURL, let targetMainURL = targetMainURL {
            let mainSuccess = self._move(from: sourceMainURL, to: targetMainURL)
            if mainSuccess {
                entity.set(for: "mainURL", value: targetMainURL.lastPathComponent)
            }
        }

        // 2. Move sup files
        entity.set(for: "supURLs", value: [], allowEmpty: true)
        let sourceSupURLs = Array(entity.supURLs).map({ return self.constructURL($0) })
        var targetSupURLs: [String] = .init()
        for (i, sourceSupURL) in sourceSupURLs.enumerated() {
            var targetSupURL = self.constructURL(targetFileName + "_sup\(i)")
            targetSupURL?.appendPathExtension(sourceSupURL?.pathExtension ?? "")

            if let sourceSupURL = sourceSupURL, let targetSupURL = targetSupURL {
                let supSuccess = self._move(from: sourceSupURL, to: targetSupURL)
                if supSuccess {
                    targetSupURLs.append(targetSupURL.lastPathComponent)
                }
            }
        }
        entity.set(for: "supURLs", value: targetSupURLs, allowEmpty: true)

        return Just<PaperEntityDraft>
            .withErrorType(entity, FileError.self)
            .eraseToAnyPublisher()
    }

    func move(for entities: [PaperEntityDraft]) -> AnyPublisher<[PaperEntityDraft], FileError> {
        var publisherList: [AnyPublisher<PaperEntityDraft, FileError>] = .init()

        entities.forEach { entity in
            let publisher = move(for: entity)
            publisherList.append(publisher)
        }

        return Publishers.MergeMany(publisherList).collect().eraseToAnyPublisher()
    }

    func _remove(for fileURL: URL) -> AnyPublisher<Bool, FileError> {
        return Future<Bool, FileError> { promise in
            var isDir: ObjCBool = false
            if FileManager.default.fileExists(atPath: fileURL.path, isDirectory: &isDir) && !isDir.boolValue {
                do {
                    try FileManager.default.removeItem(atPath: fileURL.path)
                    promise(.success(true))
                } catch {
                    print("Cannot remove \(fileURL.path)")
                    promise(.success(false))
                }
            } else {
                promise(.success(false))
            }
        }
        .eraseToAnyPublisher()
    }

    func remove(for entity: PaperEntityDraft) -> AnyPublisher<Bool, FileError> {
        var fileURLs = entity.supURLs.map({ return self.constructURL($0) })
        fileURLs.insert(self.constructURL(entity.mainURL), at: 0)

        var publisherList: [AnyPublisher<Bool, FileError>] = .init()
        fileURLs.forEach { fileURL in
            if let url = fileURL {
                publisherList.append(_remove(for: url))
            }
        }

        return Publishers.MergeMany(publisherList).allSatisfy({ return $0 }).eraseToAnyPublisher()
    }

    func remove(for entities: [PaperEntityDraft]) -> AnyPublisher<[Bool], FileError> {
        var publisherList: [AnyPublisher<Bool, FileError>] = .init()
        entities.forEach { entity in
            publisherList.append(remove(for: entity))
        }
        return Publishers.MergeMany(publisherList)
            .collect()
            .eraseToAnyPublisher()
    }

    func remove(for filePath: String) -> AnyPublisher<Bool, FileError> {
        if let fileURL = self.constructURL(filePath) {
            return _remove(for: fileURL)
        } else {
            return Just<Bool>.withErrorType(false, FileError.self)
        }
    }

    func remove(for filePaths: [String]) -> AnyPublisher<[Bool], FileError> {
        var publisherList: [AnyPublisher<Bool, FileError>] = Array()
        filePaths.forEach { filePath in
            publisherList.append(remove(for: filePath))
        }
        return Publishers.MergeMany(publisherList)
            .collect()
            .eraseToAnyPublisher()
    }

    // MARK: - Download
    func download(url: URL) -> AnyPublisher<URL?, FileError> {
        let destination = DownloadRequest.suggestedDownloadDestination(for: .downloadsDirectory)
        // TODO: Check if exists.
        func parseResponse(downloadResponse: String?, url: URL) -> AnyPublisher<URL?, FileError> {
            guard downloadResponse != nil else { return Fail(error: FileError.downloadError).eraseToAnyPublisher() }

            if let filename = url.pathComponents.last {
                var downloadedURL = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
                downloadedURL = downloadedURL.appendingPathComponent(filename)
                return CurrentValueSubject(downloadedURL)
                    .eraseToAnyPublisher()
            } else {
                return Fail(error: FileError.downloadError).eraseToAnyPublisher()
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
