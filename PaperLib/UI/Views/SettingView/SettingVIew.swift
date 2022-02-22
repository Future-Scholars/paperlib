//
//  SettingView.swift
//  PaperLib (macOS)
//
//  Created by GeoffreyChen on 23/09/2021.
//

import SwiftUI

struct SettingsView: View {
    @Environment(\.injected) private var injected: DIContainer

    private enum Tabs: Hashable {
        case general
        case metadata
        case export
        case sync
    }

    var body: some View {
        TabView {
            GeneralPage()
                .frame(minHeight: 180)
                .tabItem {
                    Label("General", systemImage: "gear")
                }
                .tag(Tabs.general)
            ScraperPage()
                .frame(minHeight: 300)
                .tabItem {
                    Label("Metadata", systemImage: "doc.text.magnifyingglass")
                }
                .tag(Tabs.metadata)
            CloudPage()
                .frame(minHeight: 100)
                .tabItem {
                    Label("Cloud", systemImage: "icloud.and.arrow.up")
                }
                .tag(Tabs.sync)
            ExportorPage()
                .frame(minHeight: 300)
                .tabItem {
                    Label("Export", systemImage: "square.and.arrow.up")
                }
                .tag(Tabs.export)
        }
        .padding()
        .frame(width: 550)
    }
}
