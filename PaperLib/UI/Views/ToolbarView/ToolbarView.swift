//
//  ToolbarView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import SwiftUI
import RealmSwift

class ToolbarViewModel: ObservableObject {
    @Published var searchText: String = ""
}

struct ToolbarView: View {
    @Environment(\.injected) private var injected: DIContainer

    @StateObject private var viewState = ToolbarViewModel()
    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    var body: some View {
        SearchBar(text: $viewState.searchText)
            .onReceive(viewState.$searchText.debounce(for: .seconds(0.3), scheduler: DispatchQueue.main), perform: { searchText in
                if injected.sharedState.sharedData.searchQuery.value != nil || !searchText.isEmpty {
                    injected.sharedState.sharedData.searchQuery.value = searchText
                }
            })
        Spacer()
        MenuButtons(selectedEntities: $selectedEntities)
    }
}
