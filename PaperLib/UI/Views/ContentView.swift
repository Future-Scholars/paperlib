//
//  ContentView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import SwiftUI

struct ContentView: View {

    private let container: DIContainer
    
    init(container: DIContainer) {
        self.container = container
    }
    
    var body: some View {

        MainView().inject(container)
        .frame(minWidth: 1300, minHeight: 800)
        
    }
    
}
