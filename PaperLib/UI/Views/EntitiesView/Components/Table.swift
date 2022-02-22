//
//  Table.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI
import RealmSwift

struct TableView: View {
    @Environment(\.injected) private var injected: DIContainer

    let entities: Results<PaperEntity>
    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    var body: some View {
        Table(entities.freeze(), selection: injected.sharedState.selection.selectedIds.binding) {
            TableColumn("Title") { entity in
                Text(entity.title).font(.subheadline)
            }
            TableColumn("Authors") { entity in
                Text(entity.authors).font(.subheadline)
            }
            .width(min: 30, ideal: 100)
            TableColumn("Publication") { entity in
                Text(entity.publication).font(.subheadline)
            }
            TableColumn("Year") { entity in
                Text(entity.pubTime).font(.subheadline)
            }
            .width(min: 50, ideal: 50, max: 50)
            TableColumn("Flag") { entity in
                if entity.flag {
                    Image(systemName: "flag.fill").opacity(0.8)
                } else {
                    Image(systemName: "flag.fill").opacity(0)
                }
            }
            .width(min: 50, ideal: 50, max: 50)
        }
        .contextMenu {
            if let entity = selectedEntities.value?.first {
                ContextMenu(clickedEntity: entity, selectedEntities: $selectedEntities)
            }
        }
    }
}
