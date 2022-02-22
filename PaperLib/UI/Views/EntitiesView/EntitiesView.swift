//
//  EntitiesView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import Combine
import RealmSwift
import SwiftUI

struct EntitiesView: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var entities: Loadable<Results<PaperEntity>>
    @Binding var selectedEntities: Loadable<Results<PaperEntity>>

    @State private var entitiesViewSwitcher: Int = 0

    var body: some View {
        content()
            .onReceive(injected.sharedState.viewState.entitiesViewSwitcher.publisher, perform: { entitiesViewSwitcher in
                self.entitiesViewSwitcher = entitiesViewSwitcher
            })
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

private extension EntitiesView {
    func notRequestedView() -> some View {
        return EmptyView()
    }

    func failedView(_: Error) -> some View {
        return EmptyView()
    }

    func loadingView(_ previouslyLoaded: Results<PaperEntity>?) -> some View {
        if let previouslyLoaded = previouslyLoaded {
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
        if entitiesViewSwitcher == 0 {
            return listView(entities)
        } else {
            return tableView(entities)
        }
    }

    func listView (_ entities: Results<PaperEntity>) -> AnyView {
        return AnyView(
            ListView(entities: entities, selectedEntities: $selectedEntities)
                .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                    DispatchQueue.global(qos: .background).async {
                        onFileDroped(providers: providers)
                    }
                    return true
                }
        )
    }

    func tableView (_ entities: Results<PaperEntity>) -> AnyView {
        return AnyView(
            TableView(entities: entities, selectedEntities: $selectedEntities)
                .onDrop(of: ["public.file-url"], isTargeted: nil) { providers -> Bool in
                    DispatchQueue.global(qos: .background).async {
                        onFileDroped(providers: providers)
                    }
                    return true
                }
        )
    }
}

// MARK: -

private extension EntitiesView {
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
            if urlList.count > 0 {
                injected.interactors.entitiesInteractor.add(from: urlList)
            }
        }
    }

}
