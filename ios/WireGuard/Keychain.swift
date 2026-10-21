// Adapted from wireguard-apple (https://github.com/WireGuard/wireguard-apple)
// Copyright © 2018-2023 WireGuard LLC. All Rights Reserved.
// SPDX-License-Identifier: MIT

import Foundation
import Security

final class Keychain {
    static func openReference(with data: Data) -> String? {
        var result: CFTypeRef?
        let status = SecItemCopyMatching(
            [
                kSecClass: kSecClassGenericPassword,
                kSecValuePersistentRef: data,
                kSecReturnData: true
            ] as CFDictionary,
            &result
        )
        if status != errSecSuccess || result == nil {
            NSLog("Unable to open config from keychain: \(status)")
            return nil
        }
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: String.Encoding.utf8)
    }

    static func makeReference(
        containing value: String,
        with name: String,
        previouslyReferencedBy oldReference: Data? = nil
    ) -> Data? {
        var status: OSStatus
        guard var bundleIdentifier = Bundle.main.bundleIdentifier else {
            NSLog("Unable to determine bundle identifier")
            return nil
        }
        if bundleIdentifier.hasSuffix(".WireGuardTunnel") {
            bundleIdentifier.removeLast(".WireGuardTunnel".count)
        }
        let itemLabel = "Tunnel: \(name)"
        var items: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrLabel: itemLabel,
            kSecAttrAccount: name + ": " + UUID().uuidString,
            kSecAttrDescription: "wireGuardConfig",
            kSecAttrService: bundleIdentifier,
            kSecValueData: value.data(using: .utf8) as Any,
            kSecReturnPersistentRef: true
        ]

        items[kSecAttrAccessGroup] = Bundle.suiteName
        items[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlock

        var reference: CFTypeRef?
        status = SecItemAdd(items as CFDictionary, &reference)
        if status != errSecSuccess || reference == nil {
            NSLog("Unable to add config to keychain: \(status)")
            return nil
        }
        if let oldReference = oldReference {
            deleteReference(with: oldReference)
        }
        return reference as? Data
    }

    static func deleteReference(with ref: Data) {
        let ret = SecItemDelete([kSecValuePersistentRef: ref] as CFDictionary)
        if ret != errSecSuccess {
            NSLog("Unable to delete config from keychain: \(ret)")
        }
    }

    static func deleteReferences(except whitelist: Set<Data>) {
        var result: CFTypeRef?
        let ret = SecItemCopyMatching(
            [kSecClass: kSecClassGenericPassword,
             kSecAttrService: Bundle.main.bundleIdentifier as Any,
             kSecMatchLimit: kSecMatchLimitAll,
             kSecReturnPersistentRef: true] as CFDictionary,
            &result
        )
        guard ret == errSecSuccess || result != nil, let items = result as? [Data] else { return }

        items.filter { !whitelist.contains($0) }.forEach { deleteReference(with: $0) }
    }

    static func verifyReference(called ref: Data) -> Bool {
        return SecItemCopyMatching(
            [
                kSecClass: kSecClassGenericPassword, kSecValuePersistentRef: ref] as CFDictionary,
            nil
        ) != errSecItemNotFound
    }
}
