//
//  NoteEditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct NoteEditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @State private var editEntityDraft: PaperEntityDraft

    init () {
        _editEntityDraft = .init(initialValue: PaperEntityDraft())
    }

    var body: some View {
        VStack {
            TextEditorView(title: "Note", text: $editEntityDraft.note, showTitle: true)
                .frame(width: 400, height: 250, alignment: .topLeading)
                .padding()

            Spacer()

            HStack {
                Button("Close", action: {
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isNoteViewShown.value = false
                })

                Spacer()
                Button("Save & Close", action: {
                    saveEditedEntity()
                    NSApp.mainWindow?.endSheet(NSApp.keyWindow!)
                    injected.sharedState.viewState.isNoteViewShown.value = false
                })
            }.padding()
        }
        .onReceive(injected.sharedState.sharedData.editEntityDraft.publisher, perform: { editEntityDraft in
            self.editEntityDraft = editEntityDraft
        })
    }
}

// MARK: - Side Effect
private extension NoteEditView {

    func saveEditedEntity () {
        injected.interactors.entitiesInteractor.update(entities: [editEntityDraft])
    }

}
