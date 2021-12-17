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
    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>)
    func load(entity: Binding<EditPaperEntity>, id: ObjectId)
    func load(entity: LoadableSubject<PaperEntity>, id: ObjectId)
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String?)
    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String?)

    func add(from fileURLs: [URL])

    func delete(ids: Set<ObjectId>)
    func delete(tagId: String)
    func delete(folderId: String)

    func update(entities: [PaperEntity], method: String, editedEntities: [EditPaperEntity]?)
    func match(entities: [PaperEntity], fetchWeb: Bool)
    func moveLib()
    func export(entities: [PaperEntity], format: String)
    
    func handleChromePluginUrl(_ url: URL)
}

struct RealEntitiesInteractor: EntitiesInteractor {
    let dbRepository: DBRepository
    let fileRepository: FileRepository
    let webRepository: WebRepository
    let appState: Store<AppState>

    let cancelBags: CancelBags = .init(["entities", "entitiesByIds", "editEntityById", "entityById", "tags", "folders", "update", "add", "match", "delete", "tags-edit", "folders-edit", "delete-tag", "delete-folder", "move-lib", "plugin"])

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

        dbRepository.entities(search: search, flag: flag, tags: tags, folders: folders, sort: sort, freeze: true)
            .sinkToLoadable {
                print("[Reloaded] entities")
                entities.wrappedValue = $0
            }
            .store(in: cancelBags["entities"])
    }

    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>) {
        cancelBags.cancel(for: "entitiesByIds")

        entities.wrappedValue.setIsLoading(cancelBag: cancelBags["entitiesByIds"])

        dbRepository.entities(ids: ids, freeze: true)
            .sinkToLoadable {
                entities.wrappedValue = $0
            }
            .store(in: cancelBags["entitiesByIds"])
    }

    func load(entity: Binding<EditPaperEntity>, id: ObjectId) {
        cancelBags.cancel(for: "editEntityById")

        dbRepository.entity(id: id, freeze: true)
            .sink(receiveCompletion: { _ in }, receiveValue: {
                entity.wrappedValue = EditPaperEntity(from: $0)
            })
            .store(in: cancelBags["editEntityById"])
    }

    func load(entity: LoadableSubject<PaperEntity>, id: ObjectId) {
        cancelBags.cancel(for: "entityById")

        entity.wrappedValue.setIsLoading(cancelBag: cancelBags["entityById"])

        dbRepository.entity(id: id, freeze: true)
            .sinkToLoadable {
                entity.wrappedValue = $0
            }
            .store(in: cancelBags["entityById"])
    }

    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String? = nil) {
        var key: String
        if cancelBagKey == nil {
            key = "tags"
        } else {
            key = cancelBagKey!
        }
        cancelBags.cancel(for: key)
        tags.wrappedValue.setIsLoading(cancelBag: cancelBags[key])

        dbRepository.tags()
            .sinkToLoadable {
                tags.wrappedValue = $0
            }
            .store(in: cancelBags[key])
    }

    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String? = nil) {
        var key: String
        if cancelBagKey == nil {
            key = "folders"
        } else {
            key = cancelBagKey!
        }
        cancelBags.cancel(for: key)

        folders.wrappedValue.setIsLoading(cancelBag: cancelBags[key])

        dbRepository.folders()
            .sinkToLoadable {
                folders.wrappedValue = $0
            }
            .store(in: cancelBags[key])
    }

    // MARK: - Add

    func add(from fileURLs: [URL]) {
        cancelBags.cancel(for: "add")

        var publisherList: [AnyPublisher<Bool, Error>] = .init()
        
        fileURLs.forEach { url in
            appState[\.receiveSignals.fetchingEntities] += 1
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap { _ in
                    fileRepository.read(from: url)
                }
                .flatMap { entity -> AnyPublisher<Bool, Error> in
                    if (entity != nil) {
                        return webRepository.fetch(for: entity!, enable: true)
                            .flatMap { entity in
                                fileRepository.move(for: entity)
                            }
                            .flatMap { entity in
                                dbRepository.add(for: entity).zip(Just<PaperEntity?>.withErrorType(entity, Error.self))
                            }
                            .flatMap { successWithEntity -> AnyPublisher<Bool, Error> in
                                if !successWithEntity.0 {
                                    return fileRepository.remove(for: successWithEntity.1)
                                } else {
                                    return Just<Bool>.withErrorType(false, Error.self)
                                }
                            }
                            .eraseToAnyPublisher()
                    }
                    else {
                        return Just<Bool>.withErrorType(false, Error.self).eraseToAnyPublisher()
                    }
                }
                .eraseToAnyPublisher()

            publisherList.append(publisher)
        }

        Publishers.MergeMany(publisherList)
            .sink(receiveCompletion: { _ in
            }, receiveValue: { _ in
                appState[\.receiveSignals.fetchingEntities] -= 1
            })
            .store(in: cancelBags["add"])
    }

    // MARK: - Delete

    func delete(ids: Set<ObjectId>) {
        cancelBags.cancel(for: "delete")

        Just<Void>
            .withErrorType(Error.self)
            .flatMap { _ in
                dbRepository.entities(ids: ids, freeze: true)
            }
            .removeDuplicates()
            .flatMap { entities in
                fileRepository.remove(for: entities).zip(dbRepository.delete(entities: entities))
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
            .store(in: cancelBags["delete"])
    }

    func delete(tagId: String) {
        cancelBags.cancel(for: "delete-tag")

        Just<Void>
            .withErrorType(Error.self)
            .flatMap { _ in
                dbRepository.delete(tagId: tagId)
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
            .store(in: cancelBags["delete-tag"])
    }

    func delete(folderId: String) {
        cancelBags.cancel(for: "delete-folder")

        Just<Void>
            .withErrorType(Error.self)
            .flatMap { _ in
                dbRepository.delete(folderId: folderId)
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
            .store(in: cancelBags["delete-folder"])
    }

    // MARK: - Update

    func update(entities: [PaperEntity], method: String, editedEntities: [EditPaperEntity]?) {
        cancelBags.cancel(for: "update")

        let editEntities = Array(entities.map { EditPaperEntity(from: $0) })

        Just<Void>
            .withErrorType(Error.self)
            .flatMap { _ -> AnyPublisher<[EditPaperEntity?], Error> in
                if editedEntities != nil {
                    return fileRepository.move(for: editedEntities!)
                } else {
                    return CurrentValueSubject<[EditPaperEntity?], Error>.init([nil]).eraseToAnyPublisher()
                }
            }
            .map {
                $0.filter { $0 != nil }.map { $0! }
            }
            .flatMap { editedEntities -> AnyPublisher<[EditPaperEntity]?, Error> in
                if editedEntities.count == 0 {
                    return CurrentValueSubject<[EditPaperEntity]?, Error>.init(nil).eraseToAnyPublisher()
                } else {
                    return CurrentValueSubject<[EditPaperEntity]?, Error>.init(editedEntities).eraseToAnyPublisher()
                }
            }
            .flatMap { editedEntities in
                dbRepository.update(entities: editEntities, method: method, editedEntities: editedEntities)
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
            .store(in: cancelBags["update"])
    }

    func match(entities: [PaperEntity], fetchWeb: Bool) {
        cancelBags.cancel(for: "match")

        var publisherList: [AnyPublisher<Bool, Error>] = .init()

        entities.forEach { entity in
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap { _ in
                    dbRepository.copy(entity: entity)
                }
                .flatMap { entity in
                    webRepository.fetch(for: entity, enable: fetchWeb)
                }
                .flatMap { entity in
                    fileRepository.move(for: entity)
                }
                .flatMap { entity in
                    dbRepository.update(entity: EditPaperEntity(from: entity!), method: "update")
                }
                .eraseToAnyPublisher()
            publisherList.append(publisher)
        }

        Publishers.MergeMany(publisherList)
            .collect()
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in })
            .store(in: cancelBags["match"])
    }

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

    func moveLib() {
        cancelBags.cancel(for: "move-lib")

        Just<Void>
            .withErrorType(Error.self)
            .flatMap { _ in
                dbRepository.entities(freeze: true)
            }
            .flatMap { entities in
                dbRepository.copy(entities: Array(entities))
            }
            .flatMap { entities in
                dbRepository.copy(entities: entities)
            }
            .flatMap { entities in
                fileRepository.move(for: entities)
            }
            .map {
                $0.filter { $0 != nil }.map { $0! }
            }
            .flatMap { entities in
                dbRepository.update(entities: entities, method: "update", editedEntities: nil)
            }
            .flatMap { _ in
                dbRepository.moveDB(to: appState[\.setting.appLibFolder])
            }
            .flatMap { _ in
                dbRepository.setDBPath(path: appState[\.setting.appLibFolder])
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { _ in
                appState[\.setting.appLibMoved] = Date()
            })
            .store(in: cancelBags["move-lib"])
    }
    
    func handleChromePluginUrl(_ url: URL) {
        
        cancelBags.cancel(for: "plugin")
        appState[\.receiveSignals.fetchingEntities] += 1
        
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
                    appState[\.receiveSignals.fetchingEntities] -= 1
                    if let downloadedUrl = $0 {
                        add(from: [downloadedUrl])
                    }
                })
                .store(in: cancelBags["plugin"])
            }
        }
    }
        
    
}

struct StubEntitiesInteractor: EntitiesInteractor {
    func moveLib() {}
    
    func delete(tagId _: String) {}

    func delete(folderId _: String) {}

    func export(entities _: [PaperEntity], format _: String) {}

    func load(folders _: LoadableSubject<Results<PaperFolder>>, cancelBagKey _: String? = nil) {}

    func load(entities _: LoadableSubject<Results<PaperEntity>>, ids _: Set<ObjectId>) {}

    func load(tags _: LoadableSubject<Results<PaperTag>>, cancelBagKey _: String?) {}

    func load(entity _: Binding<EditPaperEntity>, id _: ObjectId) {}

    func update(entities _: [PaperEntity], method _: String, editedEntities _: [EditPaperEntity]?) {}

    func match(entities _: [PaperEntity], fetchWeb _: Bool) {}

    func load(entity _: LoadableSubject<PaperEntity>, id _: ObjectId) {}

    func load(entities _: LoadableSubject<Results<PaperEntity>>, search _: String?, flag _: Bool, tags _: [String], folders _: [String], sort _: String) {}

    func add(from _: [URL]) {}

    func delete(ids _: Set<ObjectId>) {}
    
    func handleChromePluginUrl(_ url: URL) {}

}
