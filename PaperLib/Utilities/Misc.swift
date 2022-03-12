//
//  Misc.swift
//  PaperLib
//
//  Created by GeoffreyChen on 29/11/2021.
//

import Combine
import Foundation

extension String {
    func replaceCharactersFromSet(in cSet: CharacterSet, replacementString: String = "") -> String {
        return components(separatedBy: cSet).joined(separator: replacementString)
    }
}

let engLetterCharacterSet: CharacterSet = .init(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ0123456789")
let engLetterandWhiteCharacterSet: CharacterSet = .init(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ0123456789 ")

func formatString(
    _ str: String?,
    returnEmpty: Bool = true,
    removeNewline: Bool = false,
    removeWhite: Bool = false,
    removeSymbol: Bool = false,
    removeStr: String? = nil,
    lowercased: Bool = false,
    trimWhite: Bool = false
) -> String? {
    if str == nil {
        if returnEmpty {
            return ""
        } else {
            return nil
        }
    }

    var formated: String
    if removeNewline {
        formated = str!.replaceCharactersFromSet(in: CharacterSet.newlines)
    } else {
        formated = str!
    }
    if trimWhite {
        formated = formated.trimmingCharacters(in: CharacterSet.whitespaces)
    }
    if removeWhite {
        formated = formated.replaceCharactersFromSet(in: CharacterSet.whitespaces)
    }
    if removeSymbol {
        formated = formated.replaceCharactersFromSet(in: engLetterCharacterSet.inverted)
    }
    if removeStr != nil {
        formated = formated.replacingOccurrences(of: removeStr!, with: "")
    }

    if lowercased {
        formated = formated.lowercased()
    }

    return formated
}

extension Just where Output == Void {
    static func withErrorType<E>(_: E.Type) -> AnyPublisher<Void, E> {
        return withErrorType((), E.self)
    }
}

extension Just {
    static func withErrorType<E>(_ value: Output, _: E.Type) -> AnyPublisher<Output, E> {
        return Just(value)
            .setFailureType(to: E.self)
            .eraseToAnyPublisher()
    }
}

extension Publisher {
    func sinkToLoadable(_ completion: @escaping (Loadable<Output>) -> Void) -> AnyCancellable {
        return sink(receiveCompletion: { subscriptionCompletion in
            if let error = subscriptionCompletion.error {
                completion(.failed(error))
            }
        }, receiveValue: { value in
            completion(.loaded(value))
        })
    }
}

private extension Error {
    var underlyingError: Error? {
        let nsError = self as NSError
        if nsError.domain == NSURLErrorDomain, nsError.code == -1009 {
            // "The Internet connection appears to be offline."
            return self
        }
        return nsError.userInfo[NSUnderlyingErrorKey] as? Error
    }
}

extension Subscribers.Completion {
    var error: Failure? {
        switch self {
        case let .failure(error): return error
        default: return nil
        }
    }
}

func getJoinedURL(_ url: String) -> URL? {
    let rootPathStr = UserDefaults.standard.string(forKey: "appLibFolder")

    if var joinedURL = URL(string: rootPathStr ?? "") {
        joinedURL.appendPathComponent(url)
        return joinedURL
    } else {
        return nil
    }
}

func constructURL(_ path: String) -> URL? {
    if path.starts(with: "file://") {
        return URL(string: path)
    } else {
        let dbRoot = UserDefaults.standard.string(forKey: "appLibFolder") ?? ""
        var url = URL(string: dbRoot)
        url?.appendPathComponent(path)
        return url
    }
}
