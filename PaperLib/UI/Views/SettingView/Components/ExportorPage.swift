//
//  ExportorPage.swift
//  PaperLib
//
//  Created by GeoffreyChen on 22/02/2022.
//

import SwiftUI

struct ExportorPage: View {
    @Environment(\.injected) private var injected: DIContainer

    @AppStorage("exportReplacement") private var exportReplacement: Data = .init()
    @AppStorage("enableExportReplacement") private var enableExportReplacement: Bool = false
    @State private var exportReplacementContainer: [String: String] = .init()
    @State private var newReplacementKey: String = ""
    @State private var newReplacementValue: String = ""

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text("Enable replacing publication title with customed string when exporting to bibtex. For example, replacing 'Conference on Computer Vision and Pattern Recognition' by 'CVPR'.").font(.caption)
                Toggle("", isOn: $enableExportReplacement)
                    .toggleStyle(.checkbox)
                    .onChange(of: enableExportReplacement, perform: { enableExportReplacement in
                        UserDefaults.standard.set(enableExportReplacement, forKey: "enableExportReplacement")
                    })
            }
            HStack {
                TextField("original", text: $newReplacementKey).frame(width: 217, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                Image(systemName: "arrow.right")
                TextField("replacement", text: $newReplacementValue).frame(width: 217, alignment: .leading).multilineTextAlignment(.leading).font(.caption)
                Button(
                    action: {
                        if !newReplacementKey.isEmpty && !newReplacementValue.isEmpty {
                            exportReplacementContainer[formatString(newReplacementKey, removeNewline: true)!] = formatString(newReplacementValue, removeNewline: true)!
                        }
                    },
                    label: {
                        Image(systemName: "plus.circle")
                    }
                )
                .buttonStyle(PlainButtonStyle())
            }
            List {
                ForEach(Array(exportReplacementContainer.keys), id: \.self) { key in
                    HStack {
                        Text(key).frame(width: 200, alignment: .trailing).multilineTextAlignment(.trailing).font(.caption)
                        Image(systemName: "arrow.right")
                        Text(exportReplacementContainer[key]!).frame(width: 200, alignment: .leading).multilineTextAlignment(.leading).font(.caption)
                        Button(
                            action: {
                                exportReplacementContainer.removeValue(forKey: key)
                            },
                            label: {
                                Image(systemName: "delete.left")
                            }
                        )
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
        }
        .onAppear(perform: {
            guard let decodedExportReplacement = try? JSONDecoder().decode([String: String].self, from: exportReplacement) else { return }
            exportReplacementContainer = decodedExportReplacement
        })
        .onChange(of: exportReplacementContainer, perform: { _ in
            guard let encodedExportReplacement = try? JSONEncoder().encode(exportReplacementContainer) else { return }
            self.exportReplacement = encodedExportReplacement
            UserDefaults.standard.set(exportReplacement, forKey: "exportReplacement")
        })
    }
}
