//
//  Thumbnail.swift
//  PaperLib (iOS)
//
//  Created by GeoffreyChen on 25/07/2021.
//
import SwiftUI
import AppKit
import QuickLookThumbnailing


struct ThumbnailComponent: View {
    var url: URL?
    @State private var thumbnail: NSImage? = nil
    @State private var curUrl: URL? = nil
    
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        if (url == curUrl && self.thumbnail != nil) {
            if (colorScheme == .dark) {
                Image(nsImage: self.thumbnail!)
                    .mask( RoundedRectangle(cornerRadius: 5).foregroundColor(Color.black.opacity(0.55)) ).colorInvert()
                    .onTapGesture(count: 2) {
                        NSWorkspace.shared.open(url!)
                    }
            }
            else {
                Image(nsImage: self.thumbnail!)
                    .overlay(
                        RoundedRectangle(cornerRadius: 5).stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )
                    .onTapGesture(count: 2) {
                        NSWorkspace.shared.open(url!)
                    }
            }
        }
        else {
            Image(systemName: "photo").onAppear(perform: {
                generateThumbnail()
            })
        }
    }

    func generateThumbnail() {

        guard (url != nil) else {
            return
        }
        let size: NSSize = NSSize(width: 150, height: 150 * 1.4)
        let request = QLThumbnailGenerator.Request(fileAt: url!, size: size, scale: (NSScreen.main?.backingScaleFactor)!, representationTypes: .all)
        let generator = QLThumbnailGenerator.shared
        
        generator.generateRepresentations(for: request) { (thumbnail, type, error) in
            DispatchQueue.main.async {
                if error != nil {
                    if ((error! as NSError).code != 2) {
                        print("Thumbnail failed to generate")
                    }
                } else {
                    DispatchQueue.main.async {
                        self.thumbnail = thumbnail!.nsImage
                        self.curUrl = url
                    }
                }
            }
        }
    }
}
