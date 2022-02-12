//
//  DetailView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 27/11/2021.
//

import Combine
import RealmSwift
import SwiftUI

struct DetailView: View {
    @Environment(\.injected) private var injected: DIContainer
    @Environment(\.colorScheme) var colorScheme

    private var entity: PaperEntity
    private var editEntity: PaperEntityDraft

    @State private var rating: Int

    init(entity: PaperEntity) {
        _rating = State(initialValue: entity.rating)
        self.entity = entity
        editEntity = PaperEntityDraft(from: self.entity)
    }

    var body: some View {
        detailContent()
    }
}

private extension DetailView {
    func detailContent() -> some View {
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

                DetailRatingSection(shownRating: entity.rating, rating: $rating)
                    .onChange(of: rating, perform: { _ in
                        rate()
                    })
                if FileManager.default.fileExists(atPath: getJoinedUrl(entity.mainURL)?.path ?? "") {
                    DetailThumbnailSection(url: getJoinedUrl(entity.mainURL)).inject(injected)
                }
                if entity.supURLs.count >= 1 {
                    DetailsSupSection(sups: Array(entity.supURLs).map({return getJoinedUrl($0)}).filter({ $0 != nil}).map({$0!}))
                }

                if !entity.note.isEmpty {
                    DetailTextSection(title: "Note", value: entity.note)
                }
                Spacer()
            }
            .frame(width: 300, alignment: .topLeading)
            .padding(EdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10))
        }

        if colorScheme != .dark {
            return AnyView(view.background(Color.white))
        } else {
            return AnyView(view)
        }
    }

    func date2String(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .short
        return dateFormatter.string(from: date)
    }

    func rate() {
        editEntity.rating = rating
        injected.interactors.entitiesInteractor.update(entities: [editEntity])
    }

    func getJoinedUrl(_ url: String) -> URL? {
        return injected.interactors.entitiesInteractor.getJoinedUrl(url)
    }

}
