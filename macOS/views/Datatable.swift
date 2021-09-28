// The MIT License (MIT)
//
// Copyright (c) 2020–2021 Alexander Grebenyuk (github.com/kean).

#if os(macOS)

import SwiftUI
struct DatatableView: View {
    @State var items = Array(1...5000)
    
    var body: some View {
        VStack {
            Button("Shuffle") {
                self.items.shuffle()
            }
            
            List(items, id: \.self) {
                Text("Item \($0)").frame(height:10)
            }.id(UUID())
        
        }
    
    }
}
#endif
