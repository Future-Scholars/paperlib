//
//  Thumbnail.swift
//  PaperLib (iOS)
//
//  Created by GeoffreyChen on 25/07/2021.
//
import AppKit
import Combine
import SwiftUI
import PDFKit

struct ThumbnailComponent: View {
    private var url: URL?
    private var thumbnail: NSImage?
    @State private var invertColor: Bool = true

    @Environment(\.colorScheme) var colorScheme

    init(url: URL?) {
        self.url = url
        if url != nil {
            let preview = drawPDFfromURL(url: url!)
            self.thumbnail = preview
        }
    }

    var body: some View {
        if self.thumbnail != nil {
            if colorScheme == .dark {
                if invertColor {
                    Image(nsImage: self.thumbnail!)
                        .mask(RoundedRectangle(cornerRadius: 5).foregroundColor(Color.black.opacity(0.55))).colorInvert()
                        .onTapGesture(count: 2) {
                            NSWorkspace.shared.open(url!)
                        }
                } else {
                    Image(nsImage: self.thumbnail!)
                        .mask(RoundedRectangle(cornerRadius: 5).foregroundColor(Color.black.opacity(1)))
                        .onTapGesture(count: 2) {
                            NSWorkspace.shared.open(url!)
                        }
                }
            } else {
                Image(nsImage: self.thumbnail!)
                    .overlay(
                        RoundedRectangle(cornerRadius: 5).stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )
                    .onTapGesture(count: 2) {
                        NSWorkspace.shared.open(url!)
                    }
            }
        } else {
            Image(systemName: "photo")
        }
        EmptyView()
            .onReceive(invertColorUpdate, perform: {
                self.invertColor = $0
            })
    }

    func drawPDFfromURL(url: URL) -> NSImage? {
        let document = PDFDocument(url: url)
        var preview: NSImage?
        if let pdf = document {
            let page = pdf.page(at: 0)
            if let firstPage = page {
                preview = firstPage.thumbnail(of: NSSize(width: 350, height: 350 * 1.4), for: .mediaBox)
                if let previewImg = preview {
                    let destSize = NSSize(width: CGFloat(150), height: CGFloat(150 * 1.4))
                    let newImage = NSImage(size: destSize)
                    newImage.lockFocus()
                    previewImg.draw(
                        in: NSRect(x: 0, y: 0, width: destSize.width, height: destSize.height),
                        from: NSRect(x: 0, y: 0, width: previewImg.size.width, height: previewImg.size.height),
                        operation: NSCompositingOperation.copy,
                        fraction: CGFloat(1)
                    )
                    newImage.unlockFocus()
                    newImage.size = destSize
                    preview = newImage
                }
            }
        }
        return preview
    }

    var invertColorUpdate: AnyPublisher<Bool, Never> {
        UserDefaults.standard.publisher(for: \.invertColor).eraseToAnyPublisher()
    }
}
