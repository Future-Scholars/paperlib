//
//  Thumbnail.swift
//  PaperLib (iOS)
//
//  Created by GeoffreyChen on 25/07/2021.
//
import SwiftUI
import AppKit
import QuickLookThumbnailing
import Combine


struct ThumbnailComponent: View {
    @Environment(\.injected) private var injected: DIContainer
    
    var url: URL?
    @State private var thumbnail: NSImage? = nil
    @State private var curUrl: URL? = nil
    
    @State private var invertColor: Bool = true
    
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        if (url == curUrl && self.thumbnail != nil) {
            if (colorScheme == .dark) {
                if (invertColor){
                    Image(nsImage: self.thumbnail!)
                        .mask( RoundedRectangle(cornerRadius: 5).foregroundColor(Color.black.opacity(0.55)) ).colorInvert()
                        .onTapGesture(count: 2) {
                            NSWorkspace.shared.open(url!)
                        }
                }
                else {
                    Image(nsImage: self.thumbnail!)
                        .mask( RoundedRectangle(cornerRadius: 5).foregroundColor(Color.black.opacity(1)) )
                        .onTapGesture(count: 2) {
                            NSWorkspace.shared.open(url!)
                        }
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
        EmptyView()
            .onReceive(invertColorUpdate, perform: {
                self.invertColor = $0
            })
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
                        print("[Error] Thumbnail failed to generate")
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
    
    var invertColorUpdate: AnyPublisher<Bool, Never> {
        injected.appState.updates(for: \.setting.invertColor)
    }
}
