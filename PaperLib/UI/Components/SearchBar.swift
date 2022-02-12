//
//  SearchBar.swift
//  PaperLib
//
//  Created by GeoffreyChen on 29/11/2021.
//

import SwiftUI

struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
            TextField("Search ...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .frame(width: 300)
                .multilineTextAlignment(.leading)
        }.padding(.leading, 5)
    }
}

extension NSTextField {
    override open var focusRingType: NSFocusRingType {
        get { .none }
        set {}
    }
}

class SearchBarViewModel: ObservableObject {
    @Published var text: String = ""
}
