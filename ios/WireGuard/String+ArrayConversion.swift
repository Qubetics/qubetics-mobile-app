// Adapted from wireguard-apple (https://github.com/WireGuard/wireguard-apple)
// Copyright © 2018-2023 WireGuard LLC. All Rights Reserved.
// SPDX-License-Identifier: MIT

import Foundation

extension String {
    func splitToArray(separator: Character = ",", trimmingCharacters: CharacterSet? = nil) -> [String] {
        split(separator: separator)
            .map {
                guard let charSet = trimmingCharacters else { return String($0) }
                return $0.trimmingCharacters(in: charSet)
            }
    }
}

extension Optional where Wrapped == String {
    func splitToArray(separator: Character = ",", trimmingCharacters: CharacterSet? = nil) -> [String] {
        self?.splitToArray(separator: separator, trimmingCharacters: trimmingCharacters) ?? []
    }
}
