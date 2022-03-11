//
//  DetailSection.swift
//  PaperLib
//
//  Created by GeoffreyChen on 27/11/2021.
//

import SwiftUI

struct DetailTextSection: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
            Text(value)
                .font(.subheadline)
                .textSelection(.enabled)
        }.padding(.vertical, 2)
    }
}

struct DetailRatingSection: View {
    let shownRating: Int
    @Binding var rating: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Rating")
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
            RatingComponent(shownRating: shownRating, rating: $rating)
                .padding(.top, 2)
        }.padding(.vertical, 2)
    }
}

struct DetailThumbnailSection: View {
    let url: URL

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Preview")
                .font(.caption)
                .foregroundColor(Color.secondary.opacity(0.8))
            ThumbnailComponent(url: url).padding(.vertical, 5)
        }.padding(.vertical, 2)
    }
}
