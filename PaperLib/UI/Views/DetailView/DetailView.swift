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
    @Binding var selectedEntitiesDraft: Loadable<[PaperEntityDraft]>

    var body: some View {
        content()
    }

    func content() -> some View {
        switch selectedEntitiesDraft {
        case .notRequested: return AnyView(notRequestedView())
        case let .isLoading(last, _): return AnyView(loadingView(last))
        case let .loaded(detailEntities): return AnyView(loadedView(detailEntities))
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

    func loadingView(_ previouslyLoaded: [PaperEntityDraft]?) -> some View {
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

    func loadedView(_ entityDrafts: [PaperEntityDraft]) -> some View {
        if entityDrafts.count == 1 {
            let entityDraft = entityDrafts.first!

            let view = HStack {
                Divider()
                VStack(alignment: .leading) {
                    Text(entityDraft.title).font(.title2).bold().lineLimit(nil).textSelection(.enabled)

                    Group {
                        DetailTextSection(title: "Authors", value: entityDraft.authors)
                        DetailTextSection(title: "Publication", value: entityDraft.publication)
                        DetailTextSection(title: "Publication Year", value: entityDraft.pubTime)
                        if !entityDraft.tags.isEmpty {
                            DetailTextSection(title: "Tags", value: entityDraft.tags)
                        }
                        if !entityDraft.folders.isEmpty {
                            DetailTextSection(title: "Folders", value: entityDraft.folders)
                        }
                        DetailTextSection(title: "AddTime", value: date2String(entityDraft.addTime))
                    }

                    DetailRatingSection(shownRating: entityDraft.rating, rating: $viewState.rating)
                        .onReceive(viewState.$rating, perform: {
                            self.onRatingChanged(rating: $0)
                        })

                    if FileManager.default.fileExists(atPath: getJoinedURL(entityDraft.mainURL)?.path ?? "") {
                        DetailThumbnailSection(url: getJoinedURL(entityDraft.mainURL)!)
                    }
                    if entityDraft.supURLs.count >= 1 {
                        DetailsSupSection(sups: Array(entityDraft.supURLs).map({return getJoinedURL($0)}).filter({ $0 != nil}).map({$0!}))
                    }

                    if !entityDraft.note.isEmpty {
                        DetailTextSection(title: "Note", value: entityDraft.note)
                    }
                    Spacer()
                }
                .frame(width: 300, alignment: .topLeading)
                .padding(EdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10))
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
        if rating >= 0 {
            if let entityDraft = selectedEntitiesDraft.value!.first {
                entityDraft.rating = rating
                injected.interactors.entitiesInteractor.update(entities: [entityDraft])
                viewState.rating = -1
            }
        }
    }

}
