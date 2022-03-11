//
//  DetailView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 27/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

 class DetailViewState: ObservableObject {
    @Published var rating: Int = -1
 }

struct DetailView: View {
    @Environment(\.injected) private var injected: DIContainer
    @Environment(\.colorScheme) var colorScheme

    @StateObject private var viewState = DetailViewState()
    @Binding var entities: Loadable<Results<PaperEntity>> // Currently only show the first entity.

    var body: some View {
        content()
    }

    func content() -> some View {
        switch entities {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(loadingView(last))
        case let .loaded(entities): return AnyView(loadedView(entities))
        case let .failed(error): return AnyView(failedView(error))
        }
    }
}

// MARK: -

private extension DetailView {
    func notRequestedView() -> some View {
        return EmptyView()
    }

    func failedView(_: Error) -> some View {
        return EmptyView()
    }

    func loadingView(_ previouslyLoaded: Results<PaperEntity>?) -> some View {
        if let previouslyLoaded = previouslyLoaded, previouslyLoaded.count == 1 {
            return AnyView(
                ZStack {
                    loadedView(previouslyLoaded)
                    ProgressView()
                })
        } else {
            return AnyView(EmptyView())
        }
    }

    func loadedView(_ entities: Results<PaperEntity>) -> some View {
        if let entity = entities.first, entities.count == 1 {
            let view = HStack {
                Divider()
                VStack(alignment: .leading) {
                    Text(entity.title).font(.title2).bold().lineLimit(nil).textSelection(.enabled)

                    Group {
                        DetailTextSection(title: "Authors", value: entity.authors)
                        DetailTextSection(title: "Publication", value: entity.publication)
                        DetailTextSection(title: "Publication Year", value: entity.pubTime)
                        if entity.tags.count > 0 {
                            DetailTextSection(title: "Tags", value: Array(entity.tags.map { formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; "))
                        }
                        if entity.folders.count > 0 {
                            DetailTextSection(title: "Folders", value: Array(entity.folders.map { formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; "))
                        }
                        DetailTextSection(title: "AddTime", value: date2String(entity.addTime))
                    }

                    DetailRatingSection(shownRating: entity.rating, rating: $viewState.rating)
                        .onReceive(viewState.$rating, perform: {
                            self.onRatingChanged(rating: $0)
                        })

                    if FileManager.default.fileExists(atPath: getJoinedURL(entity.mainURL)?.path ?? "") {
                        DetailThumbnailSection(url: getJoinedURL(entity.mainURL)!)
                    }
                    if entity.supURLs.count >= 1 {
                        DetailsSupSection(entity: entity)
                    }

                    if !entity.note.isEmpty {
                        DetailTextSection(title: "Note", value: entity.note)
                    }
                    Spacer()
                }
                .frame(width: 300, alignment: .topLeading)
                .padding(EdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10))
                .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                    onFileDroped(providers: providers)
                    return true
                }
            }

            return colorScheme != .dark ? AnyView(view.background(Color.white)) : AnyView(view)

        } else {
            return AnyView(EmptyView())
        }
    }

}

// MARK: -

private extension DetailView {
    func date2String(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .short
        return dateFormatter.string(from: date)
    }

    func onRatingChanged(rating: Int) {
        if let entity = entities.value?.first, rating >= 0 {
            let entityDraft = PaperEntityDraft(from: entity)
            entityDraft.set(for: "rating", value: rating)
            injected.interactors.entitiesInteractor.update(entities: [entityDraft])
            viewState.rating = -1
        }
    }

    func onFileDroped(providers: [NSItemProvider]) {
        let urlGroup = DispatchGroup()

        var urlList: [URL] = .init()
        providers.forEach { provider in
            urlGroup.enter()
            provider.loadDataRepresentation(forTypeIdentifier: "public.file-url", completionHandler: { data, _ in
                if let data = data, let path = NSString(data: data, encoding: 4), let url = URL(string: path as String) {
                    urlList.append(url)
                    urlGroup.leave()
                }
            })
        }

        urlGroup.notify(queue: .main) {
            if let entity = entities.value?.first, urlList.count > 0 {
                let entityDraft = PaperEntityDraft(from: entity)

                urlList.forEach { supURL in
                    entityDraft.supURLs.append(supURL.absoluteString)
                }

                injected.interactors.entitiesInteractor.update(entities: [entityDraft])
            }
        }
    }

}
