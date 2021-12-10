//
//  RatingComponent.swift
//  PaperLib
//
//  Created by GeoffreyChen on 27/11/2021.
//

import SwiftUI


struct RatingComponent: View {
    let shownRating: Int
    @Binding var rating: Int
    
    private func starType(index: Int) -> String {
        return index <= shownRating ? "star.fill" : "star"
    }
    
    var body: some View {
        HStack {
            ForEach(1...5, id: \.self) { index in
                Image(systemName: self.starType(index: index))
                    .resizable()
                    .frame(width: 12, height: 12, alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/)
                    .foregroundColor(Color.primary)
                    .onTapGesture {
                        rating = index
                    }
            }
        }
    }
}
