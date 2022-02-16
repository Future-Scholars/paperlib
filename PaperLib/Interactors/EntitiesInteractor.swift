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

enum InteractorError: Error {
    case FileError(error: Error)
    case WebError(error: Error)
    case DBError(error: Error)
}

protocol EntitiesInteractor {
    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: [String], folders: [String], sort: String)
    func load<T: PaperCategorizer>(categorizers: LoadableSubject<Results<T>>, cancelBagKey: String)

    func add(from fileURLs: [URL])

    func delete(ids: Set<ObjectId>)
    func delete<T: PaperCategorizer>(categorizerName: String, categorizerType: T.Type)

    func update(entities: [PaperEntityDraft])
    func scrape(entities: [PaperEntityDraft])
    func routineScrape()

    func openLib()
    func migrateLocaltoSync()
    func export(entities: [PaperEntity], format: ExportFormat)

    func handleChromePluginURL(_ url: URL)
    func setRoutineTimer()
}

class RealEntitiesInteractor: EntitiesInteractor {
    let dbRepository: DBRepository
    let fileRepository: FileRepository
    let webRepository: WebRepository
    let appState: Store<AppState>
    let exporter: Exporter

    let cancelBags: CancelBags = .init(["apiVersion", "timer", "entities", "categorizer-tags", "categorizer-folders", "entitiesByIds", "update", "add", "scrape", "delete", "edit", "folders-edit", "delete-categorizer", "open-lib", "plugin"])

    var routineTimer: Publishers.Autoconnect<Timer.TimerPublisher> = Timer.publish(every: 86400, on: .main, in: .common).autoconnect()

    init(appState: Store<AppState>, dbRepository: DBRepository, fileRepository: FileRepository, webRepository: WebRepository) {
        self.appState = appState
        self.dbRepository = dbRepository
        self.fileRepository = fileRepository
        self.webRepository = webRepository
        self.exporter = Exporter(appState: self.appState)

        self.setRoutineTimer()

        self.webRepository.apiVersion()
            .sink(receiveCompletion: {_ in}, receiveValue: {_ in})
            .store(in: cancelBags["apiVersion"])
    }

    // MARK: - Select

    func load(entities: LoadableSubject<Results<PaperEntity>>, search: String?, flag: Bool, tags: [String], folders: [String], sort: String) {
        self.cancelBags.cancel(for: "entities")

        entities.wrappedValue.setIsLoading(cancelBag: self.cancelBags["entities"])

        self.dbRepository.entities(search: search, publication: nil, flag: flag, tags: tags, folders: folders, sort: sort)
            .sinkToLoadable {
                entities.wrappedValue.setIsLoading(cancelBag: CancelBag())
                print("[Reloaded] entities")
                entities.wrappedValue = $0
            }
            .store(in: self.cancelBags["entities"])
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
            self.appState[\.receiveSignals.processingCount] += 1
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
                    case .failure(let error): print("Error \(error)")
                    case .finished: self.appState[\.receiveSignals.processingCount] -= c
                    }
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
                case .failure(let error): print("Error \(error)")
                case .finished: print("Delete successful.")
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
                case .failure(let error): print("Error \(error)")
                case .finished: print("Delete successful.")
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["delete-categorizer"])
    }

    // MARK: - Update

    func update(entities: [PaperEntityDraft]) {
        self.cancelBags.cancel(for: "update")

        self.appState[\.receiveSignals.processingCount] += entities.count

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
                case .failure(let error): print("Error \(error)")
                case .finished: do {
                    print("Update successful.")
                    self.appState[\.receiveSignals.processingCount] -= entities.count
                }
                }
            }, receiveValue: { _ in })
            .store(in: self.cancelBags["update"])

    }

    func scrape(entities: [PaperEntityDraft]) {
        self.cancelBags.cancel(for: "scrape")

        var publisherList: [AnyPublisher<PaperEntityDraft, InteractorError>] = .init()

        entities.forEach { entityDraft in
            self.appState[\.receiveSignals.processingCount] += 1
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
                    case .failure(let error): print("Error \(error)")
                    case .finished: do {
                        print("Scrape successful.")
                        self.appState[\.receiveSignals.processingCount] -= c
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
        self.appState[\.setting.lastRematchTime] = Int(Date().timeIntervalSince1970)
        UserDefaults.standard.set(Int(Date().timeIntervalSince1970), forKey: "lastRematchTime")

        Just<Void>
            .withErrorType(InteractorError.self)
            .flatMap { _ in
                self.dbRepository.entities(search: nil, publication: "arXiv", flag: false, tags: [], folders: [], sort: "title")
                    .mapError { error in
                        InteractorError.DBError(error: error)
                    }
            }
            .sink(receiveCompletion: {_ in}, receiveValue: { entities in
                let drafts = entities.map({entity in return PaperEntityDraft(from: entity)})
                self.scrape(entities: Array(drafts))
            })
            .store(in: CancelBag())
    }

    // MARK: - Misc
    func export(entities: [PaperEntity], format: ExportFormat) {
        self.exporter.export(entities: entities, format: format)
    }

    func openLib() {
        Task {
            await self.dbRepository.logoutCloud()
            _ = await self.dbRepository.getConfig()
            DispatchQueue.main.sync {
                self.appState[\.receiveSignals.appLibMoved] = Date()
            }
        }
    }

    func migrateLocaltoSync() {
        self.dbRepository.migrateLocaltoCloud()
    }

    func handleChromePluginURL(_ url: URL) {
        self.cancelBags.cancel(for: "plugin")
        self.appState[\.receiveSignals.processingCount] += 1

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

                        print(downloadLink)

                        if let downloadURL = URL(string: downloadLink) {
                            self.fileRepository.download(url: downloadURL)
                            .sink(receiveCompletion: {_ in}, receiveValue: {
                                self.appState[\.receiveSignals.processingCount] -= 1
                                if let downloadedURL = $0 {
                                    self.add(from: [downloadedURL])
                                }
                            })
                            .store(in: self.cancelBags["plugin"])
                        }
                    } else {
                        self.appState[\.receiveSignals.processingCount] -= 1
                    }
                }
            }
        } catch let err {
            self.appState[\.receiveSignals.processingCount] -= 1
            print(err)
        }
    }

    func setRoutineTimer() {

        if self.appState[\.setting.lastRematchTime] == 0 {
            UserDefaults.standard.set(Int(Date().timeIntervalSince1970), forKey: "lastRematchTime")
            self.appState[\.setting.lastRematchTime] = Int(Date().timeIntervalSince1970)
        }

        if (Int(Date().timeIntervalSince1970) - self.appState[\.setting.lastRematchTime]) > (86400 * self.appState[\.setting.rematchInterval]) {
            self.routineScrape()
        }
        self.routineTimer.upstream.connect().cancel()
        self.cancelBags.cancel(for: "timer")
        self.routineTimer = Timer.publish(every: Double(86400 * self.appState[\.setting.rematchInterval]), on: .main, in: .common).autoconnect()
        self.routineTimer
            .sink(receiveValue: { [weak self] _ in
                if self?.appState[\.setting.allowRoutineMatch] ?? false {
                    self?.routineScrape()
                }
            })
            .store(in: self.cancelBags["timer"])
    }

}

struct StubEntitiesInteractor: EntitiesInteractor {

    func load(entities _: LoadableSubject<Results<PaperEntity>>, search _: String?, flag _: Bool, tags _: [String], folders _: [String], sort _: String) {}
    func load<T: PaperCategorizer>(categorizers: LoadableSubject<Results<T>>, cancelBagKey: String) {}

    func add(from _: [URL]) {}

    func delete(ids _: Set<ObjectId>) {}
    func delete<T>(categorizerName: String, categorizerType: T.Type) where T: PaperCategorizer {}

    func update(entities: [PaperEntityDraft]) {}
    func scrape(entities _: [PaperEntityDraft]) {}
    func routineScrape() {}

    func export(entities: [PaperEntity], format: ExportFormat) {}
    func openLib() {}
    func migrateLocaltoSync() {}
    func handleChromePluginURL(_ url: URL) {}
    func setRoutineTimer() {}

}
