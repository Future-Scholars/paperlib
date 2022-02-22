//
//  TextEditor.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import SwiftUI

struct TextEditorView: View {
    let title: String
    @Binding var text: String
    let showTitle: Bool

    var body: some View {
        VStack(alignment: .leading) {
            if showTitle {
                Text(title).foregroundColor(Color.primary).bold().padding(.leading, 8).padding(.top, 8)
            }
            TextEditor(text: $text)
                .foregroundColor(.primary)
                .background(Color(NSColor.windowBackgroundColor))
                .padding(.leading, 4).padding(.trailing, 4).padding(.bottom, 8)
                .frame(height: 50)
            Spacer()
        }
        .foregroundColor(.secondary)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(5)
    }
}
