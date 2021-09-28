//
//  DetailView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 10/07/2021.
//

import SwiftUI
import RealmSwift
import QuickLookThumbnailing


struct DetailsView: View {
    private var db: PLDatabase
    
    private var entityID: ObjectId
    private var title: String
    private var authors: String
    private var publication: String
    private var pubTime: String
    private var tags: String
    private var folders: String
    private var addTime: String
    private var rating: Int
    private var mainURL: String
    private var supURLs: Array<String>
    
    init(id: ObjectId, db: PLDatabase) {
        self.db = db
        let entity = self.db.selectEntity(id: id)
        
        if entity != nil {
            entityID = entity!.id
            title = entity!.title
            authors = entity!.authors
            publication = entity!.publication
            pubTime = entity!.pubTime
            tags = Array(entity!.tags.map{$0.name}).joined(separator: "; ")
            folders = Array(entity!.folders.map{$0.name}).joined(separator: "; ")
            addTime = date2String(date: entity!.addTime)
            rating = entity!.rating ?? 0
            mainURL = entity!.mainURL ?? ""
            supURLs = Array<String>()
            entity!.supURLs.forEach{ sup in
                supURLs.append(sup)
            }
        }
        else {
            entityID = ObjectId.generate()
            title = "PaperLib"
            authors = ""
            publication = ""
            pubTime = ""
            tags = ""
            folders = ""
            addTime = ""
            rating = 0
            mainURL = ""
            supURLs = Array<String>()
        }
    }
    
    var body: some View {
        VStack (alignment: .leading) {
            if (true){
                VStack (alignment: .leading) {
                    Text(title).font(.title2).bold().lineLimit(nil)
                    Group{
                        DetailsTextSection(title: "Authors", value: authors)
                        DetailsTextSection(title: "Publication", value: publication)
                        DetailsTextSection(title: "Publication Year", value: pubTime)
                        DetailsTextSection(title: "Tags", value: tags)
                        DetailsTextSection(title: "Folders", value: folders)
                        DetailsTextSection(title: "AddTime", value: addTime)
                    }
                    DetailsRatingSection(value: rating, id: entityID, db: db)
                    DetailsThumbnailSection(url: URL(string: mainURL))

                    DetailsSupSection(sups: supURLs, id: entityID, db: db)
                    
                    Spacer()
                }.frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity, alignment: .topLeading)
            }
        }.padding(EdgeInsets(top: 10, leading: 15, bottom: 10, trailing: 10))
    }
}


struct DetailsTextSection: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack (alignment: .leading, spacing: 2){
            Text(title)
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
            Text(value).font(.subheadline)
        }.padding(.vertical, 2)
    }
}

func date2String(date: Date) -> String {
    let dateFormatter = DateFormatter()
    dateFormatter.dateStyle = .short
    return dateFormatter.string(from: date)
}

struct DetailsRatingSection: View {
    var value: Int
    var id: ObjectId
    var db: PLDatabase
    
    var body: some View {
        VStack (alignment: .leading, spacing: 2){
            Text("Rating")
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
            RatingView(rating: value, id: id, db: db).padding(.top, 5)
        }.padding(.vertical, 2)
    }
}

struct RatingView: View {
    var rating: Int
    var id: ObjectId
    let db: PLDatabase
    
    private func starType(index: Int) -> String {
        return index <= rating ? "star.fill" : "star"
    }
    
    var body: some View {
        HStack {
            ForEach(1...5, id: \.self) { index in
                Image(systemName: self.starType(index: index))
                    .resizable()
                    .frame(width: 12, height: 12, alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/)
                    .foregroundColor(Color.primary)
                    .onTapGesture {
                        db.rateEntitybyID(id: id, value: index)
                    }
            }
        }
    }
}

struct DetailsThumbnailSection: View {
    let url: URL?
    
    var body: some View {
        VStack (alignment: .leading, spacing: 2){
            Text("Preview")
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
#if os(macOS)
            if url != nil {
                Thumbnail(url: url).padding(.vertical, 5)
            }
#endif
        }.padding(.vertical, 2)
    }
}

struct DetailsSupSection: View {
    var sups: Array<String>
    var id: ObjectId
    let db: PLDatabase
    
    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    
    var body: some View {
        Text("Supplementary")
            .font(.caption)
            .foregroundColor(Color.secondary.opacity(0.8))
        LazyVGrid(columns: columns, spacing: 5) {
            ForEach(sups, id: \.self) { sup in
                Button(action: {
                    let url = URL(string: sup)
                    if (url != nil) {
                        NSWorkspace.shared.open(url!)
                    }
                }) {
                    Text(sup.starts(with: "http") ? "HTTP" : "PDF").font(.subheadline)
                }.buttonStyle(BorderedButtonStyle())
                    .contextMenu {
                        Button(action: {
                            db.deleteSupsbyIDs(ids: [id], sups: [sup])
                        }) {
                            Text("Delete")
                        }
                    }
                
            }
        }.frame(alignment: .leading)
    }
}
