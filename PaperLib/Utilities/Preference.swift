//
//  Preference.swift
//  PaperLib
//
//  Created by GeoffreyChen on 19/02/2022.
//

import Foundation

extension UserDefaults {
    @objc var preferColorTheme: String {
        get {
            return string(forKey: "preferColorTheme") ?? "System Default"
        }
        set {
            set(newValue, forKey: "preferColorTheme")
        }
    }

    @objc var invertColor: Bool {
        get {
            return bool(forKey: "invertColor")
        }
        set {
            set(newValue, forKey: "invertColor")
        }
    }
}
