//
//  SupComponent.swift
//  PaperLib
//
//  Created by GeoffreyChen on 11/03/2022.
//

import SwiftUI

struct DetailsSupSection: View {
    @Environment(\.injected) private var injected: DIContainer

    var entity: PaperEntity

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

        LazyVGrid(columns: columns, spacing: 1) {
            ForEach(Array(entity.supURLs).map({return getJoinedURL($0)}).filter({ $0 != nil}).map({$0!}), id: \.self) { sup in
                Button(
                    action: {
                        NSWorkspace.shared.open(sup)
                    },
                    label: {
                        Text(sup.pathExtension.uppercased()).font(.subheadline).underline()
                    }
                )
                    .frame(height: 20)
                    .contextMenu {
                        Button("Remove", action: {
                            removeSup(url: sup)
                        })
                    }
                .buttonStyle(PlainButtonStyle())
            }
        }.frame(alignment: .leading)
    }
}

extension DetailsSupSection {
    func removeSup(url: URL) {
        injected.interactors.entitiesInteractor.deleteSup(entity: PaperEntityDraft(from: entity), url: url)
    }
}
