//
//  RootViewModifier.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import SwiftUI
import Combine


struct RootViewAppearance: ViewModifier {
    
    @Environment(\.injected) private var injected: DIContainer
    
    func body(content: Content) -> some View {
        content
    }
    
}
