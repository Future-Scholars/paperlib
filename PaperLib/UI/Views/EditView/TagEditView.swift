//
//  EditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 04/12/2021.
//

import RealmSwift
import SwiftUI

struct TagEditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var tags: Loadable<Results<PaperTag>>
    @State var editEntityDraft: PaperEntityDraft

    @State private var editString: String
    @State private var selectTag: String?

    init(tags: Binding<Loadable<Results<PaperTag>>>) {
        _tags = tags
        _editEntityDraft = .init(initialValue: PaperEntityDraft())
        _editString = .init(initialValue: "")
    }

    var body: some View {
        VStack {
            VStack(alignment: .leading) {
                TextfieldView(title: "Tags", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                    .onChange(of: editString, perform: { _ in
                        editEntityDraft.tags = editString
                    })
                TagContent()
            }
            .frame(width: 450, alignment: .leading).padding()

            Spacer()

            HStack {
                Button("Close", action: {
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isTagViewShown.value = false
                })

                Spacer()
                Button("Save & Close", action: {
                    saveEditedEntity()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isTagViewShown.value = false
                })
            }.padding()
        }
        .onReceive(injected.sharedState.sharedData.editEntityDraft.publisher, perform: { editEntityDraft in
            self.editEntityDraft = editEntityDraft
            self.editString = editEntityDraft.tags
        })
    }

    private func TagContent() -> AnyView {
        switch tags {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(tagLoadingView(last))
        case let .loaded(tags): return AnyView(tagLoadedView(tags))
        case .failed: return AnyView(EmptyView())
        }
    }

    // Tag
    func tagLoadingView(_ previouslyLoaded: Results<PaperTag>?) -> some View {
        if let tags = previouslyLoaded {
            return AnyView(tagLoadedView(tags))
        } else {
            return AnyView(EmptyView())
        }
    }

    func tagLoadedView(_ tags: Results<PaperTag>) -> some View {
        return AnyView(
            List(tags, selection: $selectTag) { tag in
                Text(tag.name).tag(tag.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectTag,
                perform: { selectTag in
                    var tagList = editEntityDraft.tags.components(separatedBy: ";")
                    if tagList.count == 1, tagList.first!.isEmpty {
                        tagList.removeAll()
                    }
                    tagList = tagList.map { formatString($0, trimWhite: true)! }

                    let formatedSelectTag = formatString(selectTag, trimWhite: true)!
                    if !tagList.contains(formatedSelectTag) {
                        tagList.append(formatedSelectTag)
                    }
                    editEntityDraft.tags = tagList.joined(separator: "; ")
                    editString = editEntityDraft.tags
                }
            )
        )
    }
}

// MARK: - Side Effect
private extension TagEditView {

    func saveEditedEntity () {
        injected.interactors.entitiesInteractor.update(entities: [editEntityDraft])
    }

}
