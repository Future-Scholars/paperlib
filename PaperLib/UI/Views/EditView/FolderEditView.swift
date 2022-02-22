//
//  FolderEditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import RealmSwift
import SwiftUI

struct FolderEditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var folders: Loadable<Results<PaperFolder>>
    @State var editEntityDraft: PaperEntityDraft

    @State private var editString: String
    @State private var selectFolder: String?

    init(folders: Binding<Loadable<Results<PaperFolder>>>) {
        _folders = folders
        _editEntityDraft = .init(initialValue: PaperEntityDraft())
        _editString = .init(initialValue: "")
    }

    var body: some View {
        VStack {
            VStack(alignment: .leading) {
                TextfieldView(title: "Folders", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                    .onChange(of: editString, perform: { _ in
                        editEntityDraft.folders = editString
                    })
                FolderContent()
            }
            .frame(width: 450, alignment: .leading).padding()

            Spacer()

            HStack {
                Button("Close", action: {
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isFolderViewShown.value = false
                })

                Spacer()
                Button("Save & Close", action: {
                    saveEditedEntity()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isFolderViewShown.value = false
                })
            }.padding()
        }
        .onReceive(injected.sharedState.sharedData.editEntityDraft.publisher, perform: { editEntityDraft in
            self.editEntityDraft = editEntityDraft
            self.editString = editEntityDraft.folders
        })
    }

    private func FolderContent() -> AnyView {
        switch folders {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(folderLoadingView(last))
        case let .loaded(folders): return AnyView(folderLoadedView(folders))
        case .failed: return AnyView(EmptyView())
        }
    }

    // Tag
    func folderLoadingView(_ previouslyLoaded: Results<PaperFolder>?) -> some View {
        if let folders = previouslyLoaded {
            return AnyView(folderLoadedView(folders))
        } else {
            return AnyView(EmptyView())
        }
    }

    func folderLoadedView(_ folders: Results<PaperFolder>) -> some View {
        return AnyView(
            List(folders, selection: $selectFolder) { folder in
                Text(folder.name).tag(folder.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectFolder,
                perform: { selectFolder in
                    var folderList = editEntityDraft.folders.components(separatedBy: ";")
                    if folderList.count == 1, folderList.first!.isEmpty {
                        folderList.removeAll()
                    }
                    folderList = folderList.map { formatString($0, trimWhite: true)! }

                    let formatedSelectFolder = formatString(selectFolder, trimWhite: true)!
                    if !folderList.contains(formatedSelectFolder) {
                        folderList.append(formatedSelectFolder)
                    }
                    editEntityDraft.folders = folderList.joined(separator: "; ")
                    editString = editEntityDraft.folders
                }
            )
        )
    }
}

// MARK: - Side Effect
private extension FolderEditView {

    func saveEditedEntity () {
        injected.interactors.entitiesInteractor.update(entities: [editEntityDraft])
    }

}
