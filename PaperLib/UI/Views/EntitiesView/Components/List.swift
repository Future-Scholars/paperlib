//
//  List.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI
import RealmSwift

struct ListRow: View {
    let entity: PaperEntity

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entity.title).bold().lineLimit(1)
            Text(entity.authors).lineLimit(1).font(.subheadline)
            HStack {
                Text(entity.pubTime).lineLimit(1)
                if !entity.pubTime.isEmpty {
                    Text("|")
                }
                Text(entity.publication).italic().lineLimit(1)
                if entity.flag {
                    Text("|")
                    Image(systemName: "flag.fill")
                }
            }.foregroundColor(Color.secondary).font(.subheadline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ListView: View {
    @Environment(\.injected) private var injected: DIContainer

    let entities: Results<PaperEntity>
    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    var body: some View {
        List(selection: injected.sharedState.selection.selectedIds.binding) {
            ForEach(entities.freeze()) { entity in
                ListRow(entity: entity).frame(height: 55)
                    .contextMenu {
                        ContextMenu(clickedEntity: entity, selectedEntities: $selectedEntities)
                    }
            }
        }
    }
}
