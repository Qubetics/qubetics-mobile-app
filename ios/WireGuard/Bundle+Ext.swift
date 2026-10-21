// Adapted from wireguard-apple (https://github.com/WireGuard/wireguard-apple)
// Copyright © 2018-2023 WireGuard LLC. All Rights Reserved.
// SPDX-License-Identifier: MIT

import Foundation

extension Bundle {
    public static var appID: String {
        "com.qubetics.wallet"
    }
    
    public static var suiteName: String {
        "group." + appID
    }

    public static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as! String
    }
}
