//
//  EntitiesInteractor.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import Combine
import Foundation
import SwiftUI
import RealmSwift
import Alamofire


protocol EntitiesInteractor {
    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: Array<String>, folders: Array<String>, sort: String)
    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>)
    func load(entity: Binding<EditPaperEntity>, id: ObjectId)
    func load(entity: LoadableSubject<PaperEntity>, id: ObjectId)
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String?)
    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String?)
    
    func fetch(from fileURLs: Array<URL>)
    
    func delete(ids: Set<ObjectId>)
    func delete(tagId: String)
    func delete(folderId: String)
    
    func update(entities: Array<PaperEntity>, method: String, editedEntities: Array<EditPaperEntity>?)
    func match(entities: Array<PaperEntity>, fetchWeb: Bool)
    
    func export(entities: Array<PaperEntity>, format: String)

}

struct RealEntitiesInteractor: EntitiesInteractor {
    
    let dbRepository: DBRepository
    let fileRepository: FileRepository
    let webRepository: WebRepository
    let appState: Store<AppState>
    
    let cancelBags: CancelBags = .init(["entities", "entitiesByIds", "editEntityById", "entityById", "tags", "folders", "update", "fetch", "delete", "tags-edit", "folders-edit", "delete-tag", "delete-folder", "moveLib"])
    
    init(appState: Store<AppState>, dbRepository: DBRepository, fileRepository: FileRepository, webRepository: WebRepository) {
        self.appState = appState
        self.dbRepository = dbRepository
        self.fileRepository = fileRepository
        self.webRepository = webRepository
    }

    // MARK: - Select
    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: Array<String>, folders: Array<String>, sort: String) {
        cancelBags.cancel(for: "entities")
        
        entities.wrappedValue.setIsLoading(cancelBag: cancelBags["entities"])
        
        dbRepository.entities(search: search, flag: flag, tags: tags, folders: folders, sort: sort, freeze: true)
            .sinkToLoadable({
                print("reloaded")
                entities.wrappedValue = $0
            })
            .store(in: cancelBags["entities"])
    }
    
    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>) {
        cancelBags.cancel(for: "entitiesByIds")
        
        entities.wrappedValue.setIsLoading(cancelBag: cancelBags["entitiesByIds"])
        
        dbRepository.entities(ids: ids, freeze: true)
            .sinkToLoadable({
                entities.wrappedValue = $0
            })
            .store(in: cancelBags["entitiesByIds"])
    }
    
    func load(entity: Binding<EditPaperEntity>, id: ObjectId) {
        cancelBags.cancel(for: "editEntityById")
        
        dbRepository.entity(id: id, freeze: true)
            .sink(receiveCompletion: {_ in}, receiveValue: {
                entity.wrappedValue = EditPaperEntity(from: $0)
            })
            .store(in: cancelBags["editEntityById"])
    }
    
    func load(entity: LoadableSubject<PaperEntity>, id: ObjectId) {
        cancelBags.cancel(for: "entityById")
        
        entity.wrappedValue.setIsLoading(cancelBag: cancelBags["entityById"])
        
        dbRepository.entity(id: id, freeze: true)
            .sinkToLoadable({
                entity.wrappedValue = $0
            })
            .store(in: cancelBags["entityById"])
    }
    
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String? = nil) {
        var key: String
        if (cancelBagKey == nil) {
            key = "tags"
        }
        else {
            key = cancelBagKey!
        }
        cancelBags.cancel(for: key)
        tags.wrappedValue.setIsLoading(cancelBag: cancelBags[key])
        
        dbRepository.tags()
            .sinkToLoadable({
                print("reloaded tags")
                tags.wrappedValue = $0
            })
            .store(in: cancelBags[key])
    }
    
    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String? = nil) {
        var key: String
        if (cancelBagKey == nil) {
            key = "folders"
        }
        else {
            key = cancelBagKey!
        }
        cancelBags.cancel(for: key)
        
        folders.wrappedValue.setIsLoading(cancelBag: cancelBags[key])
        
        dbRepository.folders()
            .sinkToLoadable({
                folders.wrappedValue = $0
            })
            .store(in: cancelBags[key])
    }
    
    // MARK: - Add
    func fetch(from fileURLs: Array<URL>) {
        cancelBags.cancel(for: "fetch")
        
        var publisherList: Array<AnyPublisher<Bool, Error>> = .init()
        
        fileURLs.forEach { url in
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap({_ in
                    fileRepository.read(from: url)
                })
                .flatMap({
                    webRepository.fetch(for: $0, enable: true)
                })
                .flatMap({ entity in
                    fileRepository.move(for: entity)
                })
                .flatMap({ entity in
                    dbRepository.add(for: entity).zip(Just<PaperEntity?>.withErrorType(entity, Error.self))
                })
                .flatMap({ successWithEntity -> AnyPublisher<Bool, Error> in
                    if (!successWithEntity.0) {
                        return fileRepository.remove(for: successWithEntity.1)
                    }
                    else {
                        return Just<Bool>.withErrorType(false, Error.self)
                    }
                })
                .eraseToAnyPublisher()
            
            publisherList.append(publisher)
        }
        
        Publishers.MergeMany(publisherList)
            .collect()
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["fetch"])
    }
    
    // MARK: - Delete
    func delete(ids: Set<ObjectId>) {
        cancelBags.cancel(for: "delete")
        
        Just<Void>
            .withErrorType(Error.self)
            .flatMap({_ in
                dbRepository.entities(ids: ids, freeze: true)
            })
            .removeDuplicates()
            .flatMap({entities in
                fileRepository.remove(for: entities).zip(dbRepository.delete(entities: entities))
            })
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["delete"])
    }
    
    func delete(tagId: String) {
        cancelBags.cancel(for: "delete-tag")
        
        Just<Void>
            .withErrorType(Error.self)
            .flatMap({ _ in
                dbRepository.delete(tagId: tagId)
            })
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["delete-tag"])
    }
    
    func delete(folderId: String) {
        cancelBags.cancel(for: "delete-folder")
        
        Just<Void>
            .withErrorType(Error.self)
            .flatMap({ _ in
                dbRepository.delete(folderId: folderId)
            })
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["delete-folder"])
    }
    
    // MARK: - Update
    
    func update(entities: Array<PaperEntity>, method: String, editedEntities: Array<EditPaperEntity>?) {
        cancelBags.cancel(for: "update")
        
        let editEntities = Array(entities.map{ EditPaperEntity(from: $0) })
        
        Just<Void>
            .withErrorType(Error.self)
            .flatMap({_ -> AnyPublisher<[EditPaperEntity?], Error> in
                if (editedEntities != nil) { 
                    return fileRepository.move(for: editedEntities!)
                }
                else {
                    return CurrentValueSubject<[EditPaperEntity?], Error>.init([nil]).eraseToAnyPublisher()
                }
            })
            .map {
                return $0.filter({ $0 != nil}).map({ $0!})
            }
            .flatMap({editedEntities in
                dbRepository.update(entities: editEntities, method: method, editedEntities: editedEntities)
            })
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["update"])
    }
    
    func match(entities: Array<PaperEntity>, fetchWeb: Bool) {
        cancelBags.cancel(for: "fetch")
        
        var publisherList: Array<AnyPublisher<Bool, Error>> = .init()
        
        entities.forEach { entity in
            let publisher = Just<Void>
                .withErrorType(Error.self)
                .flatMap({ _ in
                    dbRepository.copy(entity: entity)
                })
                .flatMap({ entity in
                    webRepository.fetch(for: entity, enable: fetchWeb)
                })
                .flatMap({ entity in
                    fileRepository.move(for: entity)
                })
                .flatMap({ entity in
                    dbRepository.update(entity: EditPaperEntity(from: entity!), method: "update")
                })
                .eraseToAnyPublisher()
            publisherList.append(publisher)
        }
        
        Publishers.MergeMany(publisherList)
            .collect()
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["fetch"])
    }
    
    func export(entities: Array<PaperEntity>, format: String) {
        if (format == "bibtex") {
            _exportBibtex(entities: entities)
        }
        else if (format == "plain") {
            _exportPlain(entities: entities)
        }
    }
    
    func _exportBibtex(entities: Array<PaperEntity>) {
        var allTexBib = ""
        entities.forEach{ entity in
            var citeKey = ""
            citeKey += entity.authors.split(separator: " ")[0] + "_"
            citeKey += entity.pubTime + "_"
            citeKey += formatString(String(entity.title[..<String.Index(utf16Offset: 3, in: entity.title)]), removeNewline: true, removeWhite: true, removeSymbol: true)!
            var texbib = ""
            if (entity.pubType == 1) {
                texbib = """
                @inproceedings{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    booktitle = {\(entity.publication)},
                }
                """
            } else {
                texbib = """
                @article{\(citeKey),
                    year = \(entity.pubTime),
                    title = {\(entity.title)},
                    author = {\(entity.authors.replacingOccurrences(of: ", ", with: " and "))},
                    journal = {\(entity.publication)},
                }
                """
            }
            allTexBib += texbib + "\n\n"
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        print(allTexBib)
        pasteBoard.writeObjects([allTexBib as NSString])
    }
    
    func _exportPlain(entities: Array<PaperEntity>) {
        var allPlain = ""
        
        entities.forEach{ entity in
            let text = "\(entity.authors). \"\(entity.title)\" In \(entity.publication), \(entity.pubTime). \n\n"
            allPlain += text
        }
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        print(allPlain)
        pasteBoard.writeObjects([allPlain as NSString])
    }
}

struct StubEntitiesInteractor: EntitiesInteractor {

    func delete(tagId: String) {

    }
    
    func delete(folderId: String) {

    }
    
    func export(entities: Array<PaperEntity>, format: String) {
    }
    
    
    func load(folders: LoadableSubject<Results<PaperFolder>>, cancelBagKey: String? = nil) {
        
    }
    
    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>) {}
    
    func load(tags: LoadableSubject<Results<PaperTag>>, cancelBagKey: String?) {
    }
    
    func load(entity: Binding<EditPaperEntity>, id: ObjectId) {}
    
    func update(entities: Array<PaperEntity>, method: String, editedEntities: Array<EditPaperEntity>?) {
    }
    
    func match(entities: Array<PaperEntity>, fetchWeb: Bool) {
    }
    
    func load(entity: LoadableSubject<PaperEntity>, id: ObjectId) {
        
    }
    
    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: Array<String>, folders: Array<String>, sort: String) {
        
    }
    
    func fetch(from fileURLs: Array<URL>) {
        
    }
    
    
    func delete(ids: Set<ObjectId>) {

    }
    
    func rateDetail(value: Int) {
    }
    
    
    
}
