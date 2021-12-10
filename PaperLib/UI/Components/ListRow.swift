//
//  ListRow.swift
//  PaperLib
//
//  Created by GeoffreyChen on 26/11/2021.
//

import SwiftUI



struct ListRow: View {
    let entity: PaperEntity
    
    var body: some View {
        
        VStack(alignment: .leading, spacing: 2) {
            
            Text(entity.title).bold().lineLimit(1)
            Text(entity.authors).lineLimit(1).font(.subheadline)
            HStack{
                Text(entity.pubTime).lineLimit(1)
                Text("|")
                Text(entity.publication).italic().lineLimit(1)
                if (entity.flag){
                    Text("|")
                    Image(systemName: "flag.fill")
                }
            }.foregroundColor(Color.secondary).font(.subheadline)
            
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

}


