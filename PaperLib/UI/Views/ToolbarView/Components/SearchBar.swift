//
//  SearchBar.swift
//  PaperLib
//
//  Created by GeoffreyChen on 29/11/2021.
//

import SwiftUI

enum SearchMode {
    case general
    case fulltext
    case advanced
}

struct SearchBar: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var text: String
    @State var searchMode: SearchMode = .general
    @State var searchModeText: String = "Search..."
    @State var isHelpShown: Bool = false

    var body: some View {
        HStack {
            Button(
                action: {
                    switch searchMode {
                    case .general: do {
                        injected.sharedState.viewState.searchMode.value = .fulltext
                    }
                    case .fulltext: do {
                        injected.sharedState.viewState.searchMode.value = .advanced
                    }
                    case .advanced: do {
                        injected.sharedState.viewState.searchMode.value = .general
                    }
                    }
                },
                label: {
                    switch searchMode {
                    case .general: do {
                        Image(systemName: "magnifyingglass")
                    }
                    case .fulltext: do {
                        Image(systemName: "text.magnifyingglass")
                    }
                    case .advanced: do {
                        Image(systemName: "plus.magnifyingglass")
                    }
                    }
                }
            )
                .buttonStyle(PlainButtonStyle())
                .help(
                    Text(isHelpShown ? """
Operators:            ==, <, >, <=, >=, !=, in, contains, and, or
Queryable fields:  title, authors, publication, pubTime, rating, note

Examples:
1) Query the paper whos title are 'Test title':
     title == 'Test title'

2) Query the paper whos title contains 'Test title':
     title contains 'Test title'

3) Query the paper whos publication year are 2008:
     pubTime == '2008'

4) Query the paper whos rating are > 3:
     rating > 3

""" : "")
                )
                .onReceive(injected.sharedState.viewState.searchMode.publisher, perform: { _ in
                    searchMode = injected.sharedState.viewState.searchMode.value
                    switch searchMode {
                    case .general:
                        searchModeText = "Search..."
                    case .fulltext:
                        searchModeText = "Fulltext Search..."
                    case .advanced:
                        searchModeText = "Advanced Search..."
                    }
                })
                .onHover(perform: { isHover in
                    if isHover && searchMode == .advanced {
                        isHelpShown = true
                    } else {
                        isHelpShown = false
                    }
                })

            TextField(searchModeText, text: $text)
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
