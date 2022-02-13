//
//  EditView.swift
//  PaperLib
//
//  Created by GeoffreyChen on 04/12/2021.
//

import RealmSwift
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

struct TextEditorView: View {
    let title: String
    @Binding var text: String
    let showTitle: Bool

    var body: some View {
        VStack(alignment: .leading) {
            if showTitle {
                Text(title).foregroundColor(Color.primary).bold().padding(.leading, 8).padding(.top, 8)
            }
            TextEditor(text: $text)
                .foregroundColor(.primary)
                .background(Color(NSColor.windowBackgroundColor))
                .padding(.leading, 4).padding(.trailing, 4).padding(.bottom, 8)
                .frame(height: 50)
            Spacer()
        }
        .foregroundColor(.secondary)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(5)
    }
}

struct EditView: View {
    @Binding var entityDraft: PaperEntityDraft

    init(_ entityDraft: Binding<[PaperEntityDraft]>) {
        _entityDraft = entityDraft.first!
    }

    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Title", text: $entityDraft.title, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Author", text: $entityDraft.authors, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Publication", text: $entityDraft.publication, showTitle: true).padding(.bottom, 10)
            HStack {
                TextfieldView(title: "PubTime", text: $entityDraft.pubTime, showTitle: true).padding(.bottom, 10)
                Picker("", selection: $entityDraft.pubType) {
                    ForEach(["Journal", "Conference", "Others"], id: \.self) {
                        Text($0)
                    }
                }.pickerStyle(SegmentedPickerStyle()).padding(.bottom, 10)
            }
            HStack {
                TextfieldView(title: "DOI", text: $entityDraft.doi, showTitle: true).padding(.bottom, 10)
                TextfieldView(title: "ArxivID", text: $entityDraft.arxiv, showTitle: true).padding(.bottom, 10).padding(.leading, 8)
            }
            TextfieldView(title: "Tags", text: $entityDraft.tags, showTitle: true).padding(.bottom, 10)
            TextfieldView(title: "Folders", text: $entityDraft.folders, showTitle: true).padding(.bottom, 10)

            TextEditorView(title: "Note", text: $entityDraft.note, showTitle: true)
        }
        .frame(width: 450, alignment: .leading).padding()
    }
}

struct TagEditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var entityDraft: PaperEntityDraft
    @State private var editString: String
    @State private var selectTag: String?

    @State private var tags: Loadable<Results<PaperTag>>

    init(_ entityDraft: Binding<[PaperEntityDraft]>) {
        _editString = State(initialValue: entityDraft.first!.tags.wrappedValue)
        _entityDraft = entityDraft.first!

        _tags = .init(initialValue: Loadable<Results<PaperTag>>.notRequested)
    }

    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Tags", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                .onChange(of: editString, perform: { _ in
                    entityDraft.tags = editString
                })
            TagContent()
        }
        .frame(width: 450, alignment: .leading).padding()
        .onAppear(perform: reloadTags)
    }

    private func TagContent() -> AnyView {
        switch tags {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(tagLoadingView(last))
        case let .loaded(tags): return AnyView(tagLoadedView(tags))
        case .failed: return AnyView(EmptyView())
        }
    }

    // Tag
    func tagLoadingView(_ previouslyLoaded: Results<PaperTag>?) -> some View {
        if let tags = previouslyLoaded {
            return AnyView(tagLoadedView(tags))
        } else {
            return AnyView(EmptyView())
        }
    }

    func tagLoadedView(_ tags: Results<PaperTag>) -> some View {
        return AnyView(
            List(tags, selection: $selectTag) { tag in
                Text(tag.name).tag(tag.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectTag,
                perform: { selectTag in
                    var tagList = entityDraft.tags.components(separatedBy: ";")
                    if tagList.count == 1, tagList.first!.isEmpty {
                        tagList.removeAll()
                    }
                    tagList = tagList.map { formatString($0, trimWhite: true)! }

                    let formatedSelectTag = formatString(selectTag, trimWhite: true)!
                    if !tagList.contains(formatedSelectTag) {
                        tagList.append(formatedSelectTag)
                    }
                    entityDraft.tags = tagList.joined(separator: "; ")
                    editString = entityDraft.tags
                }
            )
        )
    }
}

private extension TagEditView {
    func reloadTags() {
        injected.interactors.entitiesInteractor.load(categorizers: $tags, cancelBagKey: "edit")
    }
}

struct FolderEditView: View {
    @Environment(\.injected) private var injected: DIContainer

    @Binding var entityDraft: PaperEntityDraft
    @State private var editString: String
    @State private var selectFolder: String?

    @State private var folders: Loadable<Results<PaperFolder>>

    init(_ entityDraft: Binding<[PaperEntityDraft]>) {
        _editString = State(initialValue: entityDraft.first!.folders.wrappedValue)
        _entityDraft = entityDraft.first!

        _folders = .init(initialValue: Loadable<Results<PaperFolder>>.notRequested)
    }

    var body: some View {
        VStack(alignment: .leading) {
            TextfieldView(title: "Folders", text: $editString, showTitle: true, placeHolder: "seperate by ;").padding(.bottom, 10)
                .onChange(of: editString, perform: { _ in
                    entityDraft.folders = editString
                })

            FolderContent()
        }
        .frame(width: 450, alignment: .leading).padding()
        .onAppear(perform: reloadFolders)
    }

    private func FolderContent() -> AnyView {
        switch folders {
        case .notRequested: return AnyView(EmptyView())
        case let .isLoading(last, _): return AnyView(folderLoadingView(last))
        case let .loaded(folders): return AnyView(folderLoadedView(folders))
        case .failed: return AnyView(EmptyView())
        }
    }

    // Tag
    func folderLoadingView(_ previouslyLoaded: Results<PaperFolder>?) -> some View {
        if let folders = previouslyLoaded {
            return AnyView(folderLoadedView(folders))
        } else {
            return AnyView(EmptyView())
        }
    }

    func folderLoadedView(_ folders: Results<PaperFolder>) -> some View {
        return AnyView(
            List(folders, selection: $selectFolder) { folder in
                Text(folder.name).tag(folder.name)
            }
            .frame(height: 300)
            .onChange(
                of: selectFolder,
                perform: { selectFolder in
                    var folderList = entityDraft.folders.components(separatedBy: ";")
                    if folderList.count == 1, folderList.first!.isEmpty {
                        folderList.removeAll()
                    }
                    folderList = folderList.map { formatString($0, trimWhite: true)! }

                    let formatedSelectFolder = formatString(selectFolder, trimWhite: true)!
                    if !folderList.contains(formatedSelectFolder) {
                        folderList.append(formatedSelectFolder)
                    }
                    entityDraft.folders = folderList.joined(separator: "; ")
                    editString = entityDraft.folders
                }
            )
        )
    }
}

private extension FolderEditView {
    func reloadFolders() {
        injected.interactors.entitiesInteractor.load(categorizers: $folders, cancelBagKey: "edit")
    }
}

struct NoteEditView: View {
    @Binding var entityDraft: PaperEntityDraft

    init(_ entityDraft: Binding<[PaperEntityDraft]>) {
        _entityDraft = entityDraft.first!
    }

    var body: some View {
        TextEditorView(title: "Note", text: $entityDraft.note, showTitle: true)
            .frame(width: 400, height: 250, alignment: .topLeading)
            .padding()
    }
}
