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
import os.log

enum InteractorError: Error {
    case FileError(error: Error)
    case WebError(error: Error)
    case DBError(error: Error)
}

protocol EntitiesInteractor {
    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>?, search: String?, flag: Bool, tags: [String], folders: [String], sort: String, cancelBagKey: String)
    func load<T: PaperCategorizer>(categorizers: LoadableSubject<Results<T>>, cancelBagKey: String)

    func add(from fileURLs: [URL])

    func delete(ids: Set<ObjectId>)
    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type)
    func deleteSup(entity: PaperEntityDraft, url: URL)

    func update(entities: [PaperEntityDraft])
    func scrape(entities: [PaperEntityDraft])
    func routineScrape()
    func tag(ids: [ObjectId], tag: String)
    func folder(ids: [ObjectId], folder: String)

    func openLib()
    func migrateLocaltoSync()
    func export(entities: [PaperEntity], format: ExportFormat)

    func handleChromePluginURL(_ url: URL)
    func setRoutineTimer()

}

class RealEntitiesInteractor: EntitiesInteractor {
    let logger: Logger
    let sharedState: SharedState

    let dbRepository: DBRepository
    let fileRepository: FileRepository
    let webRepository: WebRepository

    let exporter: Exporter

    let cancelBags: CancelBags = .init(["apiVersion", "timer", "entities", "categorizer-tags", "categorizer-folders", "entitiesByIds", "update", "add", "scrape", "delete", "edit", "folders-edit", "delete-categorizer", "open-lib", "plugin", "tag", "folder"])

    var routineTimer: Publishers.Autoconnect<Timer.TimerPublisher> = Timer.publish(every: 86400, on: .main, in: .common).autoconnect()

    init(sharedState: SharedState, dbRepository: DBRepository, fileRepository: FileRepository, webRepository: WebRepository) {
        self.logger = Logger()
        self.sharedState = sharedState

        self.dbRepository = dbRepository
        self.fileRepository = fileRepository
        self.webRepository = webRepository
        self.exporter = Exporter()

        self.setRoutineTimer()

        self.webRepository.apiVersion()
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["apiVersion"])
    }

    // MARK: - Select

    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>?, search: String?, flag: Bool, tags: [String], folders: [String], sort: String, cancelBagKey: String) {
        self.cancelBags.cancel(for: cancelBagKey)

        entities.wrappedValue.setIsLoading(cancelBag: self.cancelBags[cancelBagKey])

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap {
                self.dbRepository.entities(ids: ids, search: search, publication: nil, flag: flag, tags: tags, folders: folders, sort: sort)
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .sinkToLoadable {
                entities.wrappedValue.setIsLoading(cancelBag: self.cancelBags[cancelBagKey])
                entities.wrappedValue = $0
            }
            .store(in: self.cancelBags[cancelBagKey])
    }

    func load<T: PaperCategorizer>(categorizers: LoadableSubject<Results<T>>, cancelBagKey: String) {
        self.cancelBags.cancel(for: cancelBagKey)
        categorizers.wrappedValue.setIsLoading(cancelBag: self.cancelBags[cancelBagKey])

        self.dbRepository.categorizers(categorizerType: T.self)
            .sinkToLoadable {
                categorizers.wrappedValue.setIsLoading(cancelBag: self.cancelBags[cancelBagKey])
                categorizers.wrappedValue = $0
            }
            .store(in: self.cancelBags[cancelBagKey])
    }

    // MARK: - Add

    func add(from urlList: [URL]) {
        self.cancelBags.cancel(for: "add")

        // 1. Files processing and web scraping publishers.
        var publisherList: [AnyPublisher<PaperEntityDraft, InteractorError>] = .init()
        urlList.forEach { url in
            self.sharedState.viewState.processingQueueCount.value += 1
            let publisher = Just<Void>
                .withErrorType(InteractorError.self)
                .flatMap { _ in
                    self.fileRepository.read(from: url)
                        .mapError { fileError in
                            return InteractorError.FileError(error: fileError)
                        }
                }
                .flatMap { entityDraft in
                    self.webRepository.scrape(for: entityDraft)
                        .mapError { webError in
                            return InteractorError.WebError(error: webError)
                        }
                }
                .eraseToAnyPublisher()

            publisherList.append(publisher)
        }

        let c = publisherList.count

        // 2. Database processing publishers.
        Publishers.MergeMany(publisherList)
            .collect()
            .flatMap { entityDrafts in
                self.fileRepository.move(for: entityDrafts)
                    .mapError { fileError in
                        return InteractorError.FileError(error: fileError)
                    }
            }
            .flatMap { entityDrafts in
                self.dbRepository.update(from: entityDrafts)
                    .mapError { error in
                        return InteractorError.DBError(error: error)
                    }
                    .zip(
                        Just<[PaperEntityDraft]>
                            .withErrorType(entityDrafts, InteractorError.self)
                            .eraseToAnyPublisher()
                    )
            }
            .flatMap { (successes, entityDrafts) -> AnyPublisher<[PaperEntityDraft], InteractorError> in
                var unsuccessedEntityList: [PaperEntityDraft] = .init()
                for (entityDraft, success) in zip(entityDrafts, successes) where !success {
                    unsuccessedEntityList.append(entityDraft)
                }
                return Just<[PaperEntityDraft]>
                    .withErrorType(unsuccessedEntityList, InteractorError.self)
                    .eraseToAnyPublisher()
            }
            .flatMap { entityDrafts in
                return self.fileRepository.remove(for: entityDrafts)
                    .mapError { fileError in
                        return InteractorError.FileError(error: fileError)
                    }
            }
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .failure(let error): do {
                        DispatchQueue.main.async {
                            self.sharedState.viewState.alertInformation.value = "Cannot add this paper: \(String(describing: error)) \(Date())"
                        }
                        self.logger.error("Cannot add this paper: \(String(describing: error))")
                    }
                    case .finished: self.logger.info("Add successful.")
                    }
                    self.sharedState.viewState.processingQueueCount.value -= c
                },
                receiveValue: { _ in
            })
            .store(in: self.cancelBags["add"])
    }

    // MARK: - Delete

    func delete(ids: Set<ObjectId>) {
        self.cancelBags.cancel(for: "delete")

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap {
                self.dbRepository.delete(ids: Array(ids))
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .flatMap { filePaths in
                self.fileRepository.remove(for: filePaths)
                    .mapError { fileError in
                        return InteractorError.FileError(error: fileError)
                    }
            }
            .sink(receiveCompletion: { completion in
                switch completion {
                case .failure(let error): do {
                    self.sharedState.viewState.alertInformation.value = "Cannot delete this paper: \(String(describing: error)) \(Date())"
                    self.logger.error("Cannot delete this paper: \(String(describing: error))")
                }
                case .finished: self.logger.info("Delete successful.")
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["delete"])
    }

    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type) {
        self.cancelBags.cancel(for: "delete-categorizer")

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap {
                self.dbRepository.delete(categorizerName: categorizerName, categorizerType: categorizerType)
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .sink(receiveCompletion: { completion in
                switch completion {
                case .failure(let error): do {
                    self.sharedState.viewState.alertInformation.value = "Cannot delete this categorizer: \(String(describing: error)) \(Date())"
                    self.logger.error("Cannot delete this categorizer: \(String(describing: error))")
                }
                case .finished: self.logger.info("Delete successful.")
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["delete-categorizer"])
    }

    func deleteSup(entity: PaperEntityDraft, url: URL) {
        self.cancelBags.cancel(for: "delete")

        self.sharedState.viewState.processingQueueCount.value += 1

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap {
                return self.fileRepository.remove(for: url.lastPathComponent)
                    .mapError { fileError in
                        return InteractorError.FileError(error: fileError)
                    }
            }
            .flatMap { success -> AnyPublisher<PaperEntityDraft, InteractorError> in
                if success {
                    entity.supURLs = entity.supURLs.filter({sup in sup != url.lastPathComponent})
                }
                return Just<PaperEntityDraft>
                    .withErrorType(entity, InteractorError.self)
                    .eraseToAnyPublisher()
            }
            .flatMap { entity in
                return self.dbRepository.update(from: [entity])
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .sink(receiveCompletion: { completion in
                switch completion {
                case .failure(let error): do {
                    self.sharedState.viewState.alertInformation.value = "Cannot delete this supplementary: \(String(describing: error)) \(Date())"
                    self.logger.error("Cannot delete this supplementary: \(String(describing: error))")
                }
                case .finished: self.logger.info("Delete supplementary successful.")
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["delete"])

        self.sharedState.viewState.processingQueueCount.value -= 1

    }

    // MARK: - Update

    func update(entities: [PaperEntityDraft]) {
        self.cancelBags.cancel(for: "update")

        self.sharedState.viewState.processingQueueCount.value += entities.count

        Just<[PaperEntityDraft]>
            .withErrorType(entities, InteractorError.self)
            .flatMap { entityDrafts in
                self.fileRepository.move(for: entityDrafts)
                    .mapError { fileError in
                        return InteractorError.FileError(error: fileError)
                    }
            }
            .flatMap { entityDrafts in
                self.dbRepository.update(from: entityDrafts)
                    .mapError { error in
                        return InteractorError.DBError(error: error)
                    }
                    .zip(
                        Just<[PaperEntityDraft]>
                            .withErrorType(entityDrafts, InteractorError.self)
                            .eraseToAnyPublisher()
                    )
            }
            .sink(receiveCompletion: { completion in
                switch completion {
                case .failure(let error): do {
                    self.sharedState.viewState.alertInformation.value = "Cannot update this paper: \(String(describing: error)) \(Date())"
                    self.logger.error("Cannot update this paper: \(String(describing: error))")
                }
                case .finished: do {
                    self.logger.info("Update successful.")
                    self.sharedState.viewState.processingQueueCount.value -= entities.count
                }
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["update"])

    }

    func scrape(entities: [PaperEntityDraft]) {
        self.cancelBags.cancel(for: "scrape")

        var publisherList: [AnyPublisher<PaperEntityDraft, InteractorError>] = .init()

        entities.forEach { entityDraft in
            self.sharedState.viewState.processingQueueCount.value += 1
            let publisher = Just<Void>
                .withErrorType(InteractorError.self)
                .flatMap { _ in
                    return self.webRepository.scrape(for: entityDraft)
                        .mapError { webError in
                            return InteractorError.WebError(error: webError)
                        }
                }
                .eraseToAnyPublisher()

            publisherList.append(publisher)
        }

        let c = publisherList.count

        Publishers.MergeMany(publisherList)
            .collect()
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .failure(let error): do {
                        self.sharedState.viewState.alertInformation.value = "Cannot scrape metadata: \(String(describing: error)) \(Date())"
                        self.logger.error("Cannot scrape metadata: \(String(describing: error))")
                    }
                    case .finished: do {
                        self.logger.info("Scrape successful.")
                        self.sharedState.viewState.processingQueueCount.value -= c
                    }
                    }
                },
                receiveValue: { entityDrafts in
                    self.update(entities: entityDrafts)
                }
            )
            .store(in: self.cancelBags["scrape"])

    }

    func routineScrape() {
        UserDefaults.standard.set(Int(Date().timeIntervalSince1970), forKey: "lastRematchTime")

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap { _ in
                self.dbRepository.entities(ids: nil, search: nil, publication: "arXiv", flag: false, tags: [], folders: [], sort: "title")
                    .mapError { error in
                        InteractorError.DBError(error: error)
                    }
            }
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .failure(let error): do {
                        self.sharedState.viewState.alertInformation.value = "Cannot update (routine) metadata: \(String(describing: error)) \(Date())"
                        self.logger.error("Cannot update (routine) metadata: \(String(describing: error))")
                    }
                    case .finished: do {
                        self.logger.info("Scrape successful.")
                    }
                    }
                },
                receiveValue: { entities in
                let drafts = entities.map({entity in return PaperEntityDraft(from: entity)})
                self.scrape(entities: Array(drafts))
            })
            .store(in: CancelBag())
    }

    func tag(ids: [ObjectId], tag: String) {
        self.cancelBags.cancel(for: "tag")
        Just<[ObjectId]>
            .withErrorType(ids, InteractorError.self)
            .flatMap { ids in
                self.dbRepository.entities(ids: Set(ids), search: nil, publication: nil, flag: false, tags: [], folders: [], sort: "addTime")
                    .first()
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { entities in
                let entityDrafts = entities.map({ entity -> PaperEntityDraft in
                    let entityDraft = PaperEntityDraft(from: entity)
                    entityDraft.tags += ";\(tag)"
                    return entityDraft
                })
                self.update(entities: Array(entityDrafts))
            })
            .store(in: self.cancelBags["tag"])
    }

    func folder(ids: [ObjectId], folder: String) {
        self.cancelBags.cancel(for: "folder")
        Just<[ObjectId]>
            .withErrorType(ids, InteractorError.self)
            .flatMap { ids in
                self.dbRepository.entities(ids: Set(ids), search: nil, publication: nil, flag: false, tags: [], folders: [], sort: "addTime")
                    .first()
                    .mapError { dbError in
                        return InteractorError.DBError(error: dbError)
                    }
            }
            .sink(receiveCompletion: { _ in }, receiveValue: { entities in
                let entityDrafts = entities.map({ entity -> PaperEntityDraft in
                    let entityDraft = PaperEntityDraft(from: entity)
                    entityDraft.folders += ";\(folder)"
                    return entityDraft
                })
                self.update(entities: Array(entityDrafts))
            })
            .store(in: self.cancelBags["folder"])
    }

    // MARK: - Misc

    func export(entities: [PaperEntity], format: ExportFormat) {
        self.exporter.export(entities: entities, format: format)
    }

    func openLib() {
        self.dbRepository.initRealm(reinit: true)
    }

    func migrateLocaltoSync() {
        self.dbRepository.migrateLocaltoCloud()
    }

    func handleChromePluginURL(_ url: URL) {
        self.cancelBags.cancel(for: "plugin")
        self.sharedState.viewState.processingQueueCount.value += 1

        do {
            var urlStr = url.absoluteString
            urlStr = formatString(urlStr, removeStr: "paperlib://")!
            let urlComponents = urlStr.components(separatedBy: "?")
            let operation = urlComponents.first

            if operation == "download" {
                if url.absoluteString.contains("arxiv.org") {
                    let pattern = "(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?"
                    var downloadLink = urlComponents[1].components(separatedBy: "=")[1]

                    let regex = try NSRegularExpression(pattern: pattern)
                    let results = regex.matches(in: downloadLink, range: NSRange(downloadLink.startIndex..., in: downloadLink))
                    let arxivID = results.map {
                        String(downloadLink[Range($0.range, in: downloadLink)!])
                    }.first

                    if let arxivID = arxivID {
                        downloadLink = "https://arxiv.org/pdf/\(arxivID).pdf"

                        if let downloadURL = URL(string: downloadLink) {
                            self.fileRepository.download(url: downloadURL)
                            .sink(receiveCompletion: {_ in}, receiveValue: {
                                self.sharedState.viewState.processingQueueCount.value -= 1
                                if let downloadedURL = $0 {
                                    self.add(from: [downloadedURL])
                                }
                            })
                            .store(in: self.cancelBags["plugin"])
                        }
                    } else {
                        self.sharedState.viewState.processingQueueCount.value -= 1
                    }
                }
            }
        } catch let error {
            self.sharedState.viewState.processingQueueCount.value -= 1
            self.sharedState.viewState.alertInformation.value = "Cannot add this paper: \(String(describing: error)) \(Date())"
            self.logger.error("Cannot add this paper: \(String(describing: error))")
        }
    }

    func setRoutineTimer() {

        if UserDefaults.standard.integer(forKey: "lastRematchTime") == 0 {
            UserDefaults.standard.set(Int(Date().timeIntervalSince1970), forKey: "lastRematchTime")
        }

        if (Int(Date().timeIntervalSince1970) - UserDefaults.standard.integer(forKey: "lastRematchTime")) > (86400 * UserDefaults.standard.integer(forKey: "rematchInterval")) {
            self.routineScrape()
        }
        self.routineTimer.upstream.connect().cancel()
        self.cancelBags.cancel(for: "timer")
        self.routineTimer = Timer.publish(every: Double(86400 * UserDefaults.standard.integer(forKey: "rematchInterval")), on: .main, in: .common).autoconnect()
        self.routineTimer
            .sink(receiveValue: { [weak self] _ in
                if UserDefaults.standard.bool(forKey: "allowRoutineMatch") {
                    self?.routineScrape()
                }
            })
            .store(in: self.cancelBags["timer"])
    }

}

struct StubEntitiesInteractor: EntitiesInteractor {

    func load(entities: LoadableSubject<Results<PaperEntity>>, ids: Set<ObjectId>?, search: String?, flag: Bool, tags: [String], folders: [String], sort: String, cancelBagKey: String) {}
    func load<T: PaperCategorizer>(categorizers: LoadableSubject<Results<T>>, cancelBagKey: String) {}

    func add(from _: [URL]) {}

    func delete(ids _: Set<ObjectId>) {}
    func delete<T>(categorizerName: String, categorizerType: T.Type) where T: PaperCategorizer {}
    func deleteSup(entity: PaperEntityDraft, url: URL) {}

    func update(entities: [PaperEntityDraft]) {}
    func scrape(entities _: [PaperEntityDraft]) {}
    func routineScrape() {}
    func tag(ids: [ObjectId], tag: String) {}
    func folder(ids: [ObjectId], folder: String) {}

    func export(entities: [PaperEntity], format: ExportFormat) {}
    func openLib() {}
    func migrateLocaltoSync() {}
    func handleChromePluginURL(_ url: URL) {}
    func setRoutineTimer() {}

    func debug() {}
}
