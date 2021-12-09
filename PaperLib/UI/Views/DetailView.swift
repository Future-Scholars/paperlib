//
//  DetailView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 27/11/2021.
//

import SwiftUI
import Combine
import RealmSwift


struct DetailView: View {
    @Environment(\.injected) private var injected: DIContainer
    @Environment(\.colorScheme) var colorScheme
    
    private var entity: PaperEntity
    private var editEntity: EditPaperEntity
    
    @State private var rating: Int
    
    init(entity: PaperEntity) {
        _rating = State(initialValue: entity.rating ?? 0)
        self.entity = entity
        self.editEntity = EditPaperEntity(from: self.entity)
    }
    
    var body: some View {
        detailContent()
    }
}


private extension DetailView {
    
    func detailContent() -> some View {
        let view = HStack{
            Divider()
            VStack (alignment: .leading) {
                Text(entity.title).font(.title2).bold().lineLimit(nil).textSelection(.enabled)

                Group{
                    DetailTextSection(title: "Authors", value: entity.authors)
                    DetailTextSection(title: "Publication", value: entity.publication)
                    DetailTextSection(title: "Publication Year", value: entity.pubTime)
                    if (entity.tags.count > 0) {
                        DetailTextSection(title: "Tags", value: Array(entity.tags.map{ formatString($0.name, returnEmpty: true, removeStr: "tag-")! }).joined(separator: "; "))
                    }
                    if (entity.folders.count > 0) {
                        DetailTextSection(title: "Folders", value: Array(entity.folders.map{ formatString($0.name, returnEmpty: true, removeStr: "folder-")! }).joined(separator: "; "))
                    }
                    DetailTextSection(title: "AddTime", value: date2String(entity.addTime))
                }

                DetailRatingSection(shownRating: entity.rating ?? 0, rating: $rating)
                    .onChange(of: rating, perform: {_ in
                        rate()
                    })
                DetailThumbnailSection(url: URL(string: entity.mainURL ?? ""))
                if (entity.supURLs.count >= 1){
                    DetailsSupSection(sups: Array(entity.supURLs))
                }
                Spacer()
            }
            .frame(width: 300, alignment: .topLeading)
            .padding(EdgeInsets(top: 10, leading: 10, bottom: 10, trailing: 10))
        }

        if (colorScheme != .dark) {
            return AnyView(view.background(Color.white))
        }
        else {
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
        injected.interactors.entitiesInteractor.update(entities: [entity], method: "update", editedEntities: [editEntity])
    }
 
}
