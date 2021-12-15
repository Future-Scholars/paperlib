//
//  KeyValueRow.swift
//  PaperLib
//
//  Created by GeoffreyChen on 14/12/2021.
//

import SwiftUI

struct KeyValueRow: View {
    @Binding var key: String
    @Binding var value: String
    
    var body: some View {
        HStack{
            TextField("", text: $key)
            TextField("", text: $value)
        }
    }
}
