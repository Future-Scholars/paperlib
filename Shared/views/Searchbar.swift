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
    open override var focusRingType: NSFocusRingType {
        get { .none }
        set { }
    }
}
