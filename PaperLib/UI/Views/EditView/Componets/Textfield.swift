//
//  Textfield.swift
//  PaperLib
//
//  Created by GeoffreyChen on 21/02/2022.
//

import SwiftUI

struct TextfieldView: View {
    let title: String
    @Binding var text: String
    let showTitle: Bool
    var placeHolder: String?

    var body: some View {
        HStack {
            Spacer()
            if showTitle {
                Text(title).foregroundColor(Color.primary).bold()
            }
            TextField(placeHolder ?? title, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .foregroundColor(.primary)
                .padding(8)
            Spacer()
        }
        .foregroundColor(.secondary)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(5)
    }
}

extension NSTextView {
  open override var frame: CGRect {
    didSet {
      backgroundColor = .clear
      drawsBackground = true
    }
  }
}
