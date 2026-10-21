// Adapted from wireguard-apple (https://github.com/WireGuard/wireguard-apple)
// Copyright © 2018-2023 WireGuard LLC. All Rights Reserved.
// SPDX-License-Identifier: MIT

import Foundation

enum ConfigurationParserState {
    case inInterfaceSection
    case inPeerSection
    case notInASection
}

enum ConfigurationParseError: Error {
    case invalidLine(String.SubSequence)
    case noInterface
    case multipleInterfaces
    case interfaceHasNoPrivateKey
    case interfaceHasInvalidPrivateKey(String)
    case interfaceHasInvalidListenPort(String)
    case interfaceHasInvalidAddress(String)
    case interfaceHasInvalidDNS(String)
    case interfaceHasInvalidMTU(String)
    case interfaceHasUnrecognizedKey(String)
    case peerHasNoPublicKey
    case peerHasInvalidPublicKey(String)
    case peerHasInvalidPreSharedKey(String)
    case peerHasInvalidAllowedIP(String)
    case peerHasInvalidEndpoint(String)
    case peerHasInvalidPersistentKeepAlive(String)
    case peerHasInvalidTransferBytes(String)
    case peerHasInvalidLastHandshakeTime(String)
    case peerHasUnrecognizedKey(String)
    case multiplePeersWithSamePublicKey
    case multipleEntriesForKey(String)
}
