//
//  TextfieldView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 23/09/2021.
//

import SwiftUI

struct TextfieldView: View {
    let title: String
    @Binding var text: String
    let showTitle: Bool
    
    #if !os(macOS)
    private let backgroundColor = Color(UIColor.secondarySystemBackground)
    #else
    private let backgroundColor = Color(NSColor.windowBackgroundColor)
    #endif
    
    var body: some View {
            HStack {
                Spacer()
                if (showTitle) {
                    Text(title).foregroundColor(Color.primary).bold()
                }
                TextField(title, text: $text)
                    .textFieldStyle(PlainTextFieldStyle())
                    .foregroundColor(.primary)
                    .padding(8)
                Spacer()
            }
            .foregroundColor(.secondary)
            .background(backgroundColor)
            .cornerRadius(10)
    }
}

//struct TextfieldView_Previews: PreviewProvider {
//    static var previews: some View {
//        TextfieldView()
//    }
//}
