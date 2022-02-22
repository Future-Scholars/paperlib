//
//  EditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 04/12/2021.
//

import RealmSwift
import SwiftUI

struct EditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @State private var editEntityDraft: PaperEntityDraft

    init () {
        _editEntityDraft = .init(initialValue: PaperEntityDraft())
    }

    var body: some View {
        VStack {
            VStack(alignment: .leading) {
                TextfieldView(title: "Title", text: $editEntityDraft.title, showTitle: true).padding(.bottom, 10)
                TextfieldView(title: "Author", text: $editEntityDraft.authors, showTitle: true).padding(.bottom, 10)
                TextfieldView(title: "Publication", text: $editEntityDraft.publication, showTitle: true).padding(.bottom, 10)
                HStack {
                    TextfieldView(title: "PubTime", text: $editEntityDraft.pubTime, showTitle: true).padding(.bottom, 10)
                    Picker("", selection: $editEntityDraft.pubType) {
                        ForEach(["Journal", "Conference", "Others"], id: \.self) {
                            Text($0)
                        }
                    }.pickerStyle(SegmentedPickerStyle()).padding(.bottom, 10)
                }
                HStack {
                    TextfieldView(title: "DOI", text: $editEntityDraft.doi, showTitle: true).padding(.bottom, 10)
                    TextfieldView(title: "ArxivID", text: $editEntityDraft.arxiv, showTitle: true).padding(.bottom, 10).padding(.leading, 8)
                }
                TextfieldView(title: "Tags", text: $editEntityDraft.tags, showTitle: true).padding(.bottom, 10)
                TextfieldView(title: "Folders", text: $editEntityDraft.folders, showTitle: true).padding(.bottom, 10)

                TextEditorView(title: "Note", text: $editEntityDraft.note, showTitle: true)
            }
            .frame(width: 450, alignment: .leading).padding()

            Spacer()
            HStack {
                Button("Close", action: {
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isEditViewShown.value = false
                })

                Spacer()
                Button("Save & Close", action: {
                    saveEditedEntity()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isEditViewShown.value = false
                })
            }.padding()
        }
        .onReceive(injected.sharedState.sharedData.editEntityDraft.publisher, perform: { editEntityDraft in
            self.editEntityDraft = editEntityDraft
        })
    }
}

// MARK: - Side Effect
private extension EditView {

    func saveEditedEntity () {
        injected.interactors.entitiesInteractor.update(entities: [editEntityDraft])
    }

}
