//
//  CancelBag.swift
//  CountriesSwiftUI
//
//  Created by Alexey Naumov on 04.04.2020.
//  Copyright © 2020 Alexey Naumov. All rights reserved.
//

import Combine

final class CancelBag {
    fileprivate(set) var subscriptions = Set<AnyCancellable>()

    func cancel() {
        subscriptions.removeAll()
    }
}

extension AnyCancellable {
    func store(in cancelBag: CancelBag) {
        cancelBag.subscriptions.insert(self)
    }
}

final class CancelBags {
    var bags: [String: CancelBag] = .init()

    init(_ keys: [String]) {
        keys.forEach { key in
            bags[key] = CancelBag()
        }
    }

    func cancel(for key: String) {
        bags[key]?.cancel()
    }

    subscript(key: String) -> CancelBag {
        return bags[key]!
    }
}
