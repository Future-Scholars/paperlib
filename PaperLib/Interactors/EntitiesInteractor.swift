//
//  EntitiesInteractor.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Alamofire
import Combine
import Foundation
import RealmSwift
import SwiftUI

protocol EntitiesInteractor {
    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: [String], folders: [String], sort: String)
    func load(entities: LoadableSubject<Results<PaperEntity>>, drafts: Binding<[PaperEntityDraft]>, ids: Set<ObjectId>)
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String?)
    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String?)

    func add(from fileURLs: [URL])

    func delete(ids: Set<ObjectId>)
    func delete(tagId: String)
    func delete(folderId: String)

    func update(entities: [PaperEntityDraft])
    func match(entities: [PaperEntityDraft])
    
    func openLib()
    func export(entities: [PaperEntity], format: String)
    
    func handleChromePluginUrl(_ url: URL)
    func getJoinedUrl(_ url: String) -> URL?
}

struct RealEntitiesInteractor: EntitiesInteractor {
    let dbRepository: DBRepository
    let fileRepository: FileRepository
    let webRepository: WebRepository
    let appState: Store<AppState>

    let cancelBags: CancelBags = .init(["entities", "entitiesByIds", "tags", "folders", "update", "add", "match", "delete", "tags-edit", "folders-edit", "delete-tag", "delete-folder", "open-lib", "plugin"])

    init(appState: Store<AppState>, dbRepository: DBRepository, fileRepository: FileRepository, webRepository: WebRepository) {
        self.appState = appState
        self.dbRepository = dbRepository
        self.fileRepository = fileRepository
        self.webRepository = webRepository
    }

    // MARK: - Select

    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: [String], folders: [String], sort: String) {
        cancelBags.cancel(for: "entities")

        entities.wrappedValue.setIsLoading(cancelBag: cancelBags["entities"])

        Task {
            await dbRepository.entities(search: search, flag: flag, tags: tags, folders: folders, sort: sort, freeze: true)
                .sinkToLoadable {
                    print("[Reloaded] entities")
                    entities.wrappedValue = $0
                }
                .store(in: cancelBags["entities"])
        }
    }

    func load(entities: LoadableSubject<Results<PaperEntity>>, drafts: Binding<[PaperEntityDraft]>, ids: Set<ObjectId>) {
        cancelBags.cancel(for: "entitiesByIds")

        entities.wrappedValue.setIsLoading(cancelBag: cancelBags["entitiesByIds"])

        Task {
            await dbRepository.entities(ids: ids, freeze: true)
                .sink(receiveCompletion: {_ in}, receiveValue: {
                    entities.wrappedValue = .loaded($0)
                    drafts.wrappedValue = $0.map({ PaperEntityDraft(from: $0) })
                })
                .store(in: cancelBags["entitiesByIds"])
        }
    }
    
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String? = nil) {

        Task {
            var key: String
            if cancelBagKey == nil {
                key = "tags"
            } else {
                key = cancelBagKey!
            }
            cancelBags.cancel(for: key)
            tags.wrappedValue.setIsLoading(cancelBag: cancelBags[key])

            await dbRepository.tags()
                .sinkToLoadable {
                    tags.wrappedValue = $0
                }
                .store(in: cancelBags[key])
        }
    }

    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String? = nil) {
        Task {
            var key: String
            if cancelBagKey == nil {
                key = "folders"
            } else {
                key = cancelBagKey!
            }
            cancelBags.cancel(for: key)

            folders.wrappedValue.setIsLoading(cancelBag: cancelBags[key])

            await dbRepository.folders()
                .sinkToLoadable {
                    folders.wrappedValue = $0
                }
                .store(in: cancelBags[key])
        }
    }

    // MARK: - Add

    func add(from fileURLs: [URL]) {
        cancelBags.cancel(for: "add")

        var publisherList: [AnyPublisher<PaperEntityDraft, Error>] = .init()
        
        fileURLs.forEach { url in
            appState[\.receiveSignals.processingCount] += 1
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap { _ in
                    fileRepository.read(from: url)
                }
                .flatMap { entity -> AnyPublisher<PaperEntityDraft, Error> in
                    return webRepository.fetch(for: entity!, enable: true).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher()

            publisherList.append(publisher)
        }
        
        let c = publisherList.count
        
        Publishers.MergeMany(publisherList)
            .collect()
            .flatMap({ entities in
                fileRepository.move(for: entities)
            })
            .sink(receiveCompletion: { _ in }, receiveValue: {entities in
                
                let filteredEntities = entities.filter({ $0 != nil }).map({ $0! })
                Task {
                    await dbRepository.add(for: filteredEntities)
                        .flatMap { failedPaths -> AnyPublisher<[Bool], Error> in
                            return fileRepository.remove(for: failedPaths)
                        }
                        .sink(receiveCompletion: { _ in }, receiveValue: {_ in
                            appState[\.receiveSignals.processingCount] -= c
                        })
                        .store(in: CancelBag())
                }
                
            })
            .store(in: cancelBags["add"])
    }

    // MARK: - Delete

    func delete(ids: Set<ObjectId>) {
        cancelBags.cancel(for: "delete")

        Task {
            await dbRepository.delete(ids: Array(ids))
                .flatMap { filePaths in
                    fileRepository.remove(for: filePaths)
                }
                .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
                .store(in: cancelBags["delete"])
        }
    }

    func delete(tagId: String) {
        cancelBags.cancel(for: "delete-tag")

        Task {
            await dbRepository.delete(tagId: tagId)
                .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
                .store(in: cancelBags["delete-tag"])
        }
    }

    func delete(folderId: String) {
        cancelBags.cancel(for: "delete-folder")

        Task{
            await dbRepository.delete(folderId: folderId)
                .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
                .store(in: cancelBags["delete-folder"])
        }
    }

    // MARK: - Update

    func update(entities: [PaperEntityDraft]) {
        cancelBags.cancel(for: "update")

        Just<[PaperEntityDraft]>
            .withErrorType(entities, Error.self)
            .flatMap { entities in
                fileRepository.move(for: entities)
            }
            .sink(receiveCompletion: { _ in }, receiveValue: {entities in
                let filteredEntities = entities.filter({ $0 != nil }).map({ $0! })
                Task{
                    await dbRepository.update(from: filteredEntities)
                        .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
                        .store(in: CancelBag())
                }
            })
            .store(in: cancelBags["update"])

    }

    func match(entities: [PaperEntityDraft]) {
        cancelBags.cancel(for: "match")
        
        var publisherList: [AnyPublisher<PaperEntityDraft, Error>] = .init()
        
        entities.forEach { entity in
            appState[\.receiveSignals.processingCount] += 1
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap { _ -> AnyPublisher<PaperEntityDraft, Error> in
                    return webRepository.fetch(for: entity, enable: true).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher()

            publisherList.append(publisher)
        }
        
        let c = publisherList.count
        
        Publishers.MergeMany(publisherList)
            .collect()
            .flatMap { entities in
                fileRepository.move(for: entities)
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { entities in
                let filteredEntities = entities.filter({ $0 != nil }).map({ $0! })
                Task {
                    await dbRepository.update(from: filteredEntities)
                        .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
                        .store(in: CancelBag())
                    
                    appState[\.receiveSignals.processingCount] -= c
                }
                
            })
            .store(in: cancelBags["match"])
    }

    // MARK: -
    func export(entities: [PaperEntity], format: String) {
        if format == "bibtex" {
            _exportBibtex(entities: entities)
        } else if format == "plain" {
            _exportPlain(entities: entities)
        }
    }

    func _replacePublication(_ publication: String) -> String {
        if (appState[\.setting.exportReplacement] == nil || !appState[\.setting.enableExportReplacement]) {
            return publication
        }
        let exportReplacement = try? JSONDecoder().decode([String: String].self, from: appState[\.setting.exportReplacement]!)
        if (exportReplacement == nil) {
            return publication
        }
        if let replace = exportReplacement![publication] {
            return replace
        }
        else {
            return publication
        }
    }
    
    func _exportBibtex(entities: [PaperEntity]) {
        var allTexBib = ""
        
        entities.forEach { entity in
            var citeKey = ""
            citeKey += entity.authors.split(separator: " ")[0] + "_"
            citeKey += entity.pubTime + "_"
            citeKey += formatString(String(entity.title[..<String.Index(utf16Offset: 3, in: entity.title)]), removeNewline: true, removeWhite: true, removeSymbol: true)!
            var texbib = ""
            if entity.pubType == 1 {
                texbib = """
                @inproceedings{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    booktitle = {\(_replacePublication(entity.publication))},
                }
                """
            } else {
                texbib = """
                @article{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    journal = {\(_replacePublication(entity.publication))},
                }
                """
            }
            allTexBib += texbib + "\n\n"
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        pasteBoard.writeObjects([allTexBib as NSString])
    }

    func _exportPlain(entities: [PaperEntity]) {
        var allPlain = ""

        entities.forEach { entity in
            let text = "\(entity.authors). \"\(entity.title)\" In \(entity.publication), \(entity.pubTime). \n\n"
            allPlain += text
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        pasteBoard.writeObjects([allPlain as NSString])
    }

    func openLib() {
        Task{
            let _ = await dbRepository.open(settings: appState[\.setting])
            DispatchQueue.main.sync{
                appState[\.receiveSignals.appLibMoved] = Date()
            }
        }                       
    }
    
    func handleChromePluginUrl(_ url: URL) {
        
        cancelBags.cancel(for: "plugin")
        appState[\.receiveSignals.processingCount] += 1
        
        var urlStr = url.absoluteString
        urlStr = formatString(urlStr, removeStr: "paperlib://")!
        let urlComponents = urlStr.components(separatedBy: "?")
        let operation = urlComponents.first
        
        if (operation == "download") {
            var downloadLink = urlComponents[1].components(separatedBy: "=")[1]
            downloadLink = downloadLink.replacingOccurrences(of: ".pdf.pdf", with: ".pdf")
            
            if let downloadUrl = URL(string: downloadLink) {
                fileRepository.download(url: downloadUrl)
                .sink(receiveCompletion: {_ in}, receiveValue: {
                    appState[\.receiveSignals.processingCount] -= 1
                    if let downloadedUrl = $0 {
                        add(from: [downloadedUrl])
                    }
                })
                .store(in: cancelBags["plugin"])
            }
        }
    }
    
    func getJoinedUrl(_ url: String) -> URL? {
        if var joinedURL = URL(string: appState[\.setting.appLibFolder]) {
            joinedURL.appendPathComponent(url)
            return joinedURL
        }
        else {
            return nil
        }
    }
    
}

struct StubEntitiesInteractor: EntitiesInteractor {
    func load(entities: LoadableSubject<Results<PaperEntity>>, drafts: Binding<[PaperEntityDraft]>, ids: Set<ObjectId>) {
        
    }
    
    func update(entities: [PaperEntityDraft]) {
        
    }
    
    func getJoinedUrl(_ url: String) -> URL? {
        return URL(string: "")
    }
    
    func openLib() {}
    
    func delete(tagId _: String) {}

    func delete(folderId _: String) {}

    func export(entities _: [PaperEntity], format _: String) {}

    func load(folders _: LoadableSubject<Results<PaperFolder>>, cancelBagKey _: String? = nil) {}

    func load(tags _: LoadableSubject<Results<PaperTag>>, cancelBagKey _: String?) {}

    func match(entities _: [PaperEntityDraft]) {}

    func load(entities _: LoadableSubject<Results<PaperEntity>>, search _: String?, flag _: Bool, tags _: [String], folders _: [String], sort _: String) {}

    func add(from _: [URL]) {}

    func delete(ids _: Set<ObjectId>) {}
    
    func handleChromePluginUrl(_ url: URL) {}

}
