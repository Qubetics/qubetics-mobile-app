//
//  ECDSA.swift
//  ECDSA
//
//  Created by yuzushioh on 2018/01/25.
//  Copyright © 2018 yuzushioh. All rights reserved.
//

import Foundation
import secp256k1

public final class ECDSA {
    public static let secp256k1 = ECDSA()
    
    public func generatePublicKey(with privateKey: Data, isCompressed: Bool) -> Data {
        return generatePublicKey(privateKeyData: privateKey, isCompression: isCompressed)!
    }
    
    func generatePublicKey(privateKeyData: Data, isCompression: Bool) -> Data? {
        // Create signing context
        guard let context = secp256k1_context_create(UInt32(SECP256K1_CONTEXT_SIGN)) else {
            return nil
        }
        defer { secp256k1_context_destroy(context) }

        var pubkey = secp256k1_pubkey()

        // Create pubkey from private key
        let createResult: Int32 = privateKeyData.withUnsafeBytes { rawBuf in
            // Bind the raw base address to UInt8 as required by the C API
            let ptr = rawBuf.bindMemory(to: UInt8.self).baseAddress
            guard let prvPtr = ptr else { return 0 }
            return secp256k1_ec_pubkey_create(context, &pubkey, prvPtr)
        }
        if createResult != 1 { return nil }

        // Serialize public key
        let size = isCompression ? 33 : 65
        var serialized = Data(count: size)
        var outLen = size_t(size)
        let flags = isCompression ? UInt32(SECP256K1_EC_COMPRESSED) : UInt32(SECP256K1_EC_UNCOMPRESSED)

        let serializeResult: Int32 = serialized.withUnsafeMutableBytes { rawMutBuf in
            let outPtr = rawMutBuf.bindMemory(to: UInt8.self).baseAddress
            guard let out = outPtr else { return 0 }
            return secp256k1_ec_pubkey_serialize(context, out, &outLen, &pubkey, flags)
        }
        if serializeResult != 1 { return nil }

        // outLen should match requested size, but trim if library adjusted it
        if outLen != size_t(size) {
            serialized.removeSubrange(Int(outLen)..<serialized.count)
        }
        return serialized
    }
}
