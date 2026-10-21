//
//  WireGuardVPNModule.swift
//  QubeticsWallet
//
//

import Foundation
import NetworkExtension
import React
import WireGuardKit

@objc(WireGuardVPNModule)
class WireGuardVPNModule: NSObject,RCTBridgeModule {
  

  private var tunnelManager: WireguardTunnelManager?

  override init() {
    super.init()
  }
  static func moduleName() -> String! {
    return "WireGuardVPNModule"

  }
 @objc(createOrUpdateVPN:resolver:rejecter:)
  func createOrUpdateVPN(_ wgConfig: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {

      // 1. Stop current tunnel if running
      tunnelManager?.stopTunnel()
      tunnelManager = nil

      // 2. Remove all existing VPN managers
      NETunnelProviderManager.loadAllFromPreferences { managers, _ in
          let group = DispatchGroup()
          managers?.forEach { mgr in
              group.enter()
              mgr.removeFromPreferences { _ in
                  group.leave()
              }
          }

          group.notify(queue: .main) {
              // 3. Create a new manager with updated config
              WireguardTunnelManager.loadOrCreateManager(
                  bundleIdentifier: "com.qubetics.wallet.WireGuardTunnel",
                  configString: wgConfig
              ) { [weak self] manager, error in
                  if let error = error {
                      reject("MANAGER_ERROR", "Failed to load/create VPN manager", error)
                      return
                  }

                  guard let manager = manager else {
                      reject("NO_MANAGER", "Tunnel manager is nil", nil)
                      return
                  }

                  // 4. Save the new manager
                  manager.manager.saveToPreferences { saveError in
                      if let saveError = saveError {
                          reject("SAVE_ERROR", "Failed to save VPN config", saveError)
                          return
                      }

                      // 5. Reload the saved manager to ensure fresh config
                      manager.manager.loadFromPreferences { loadError in
                          if let loadError = loadError {
                              reject("LOAD_ERROR", "Failed to reload VPN config", loadError)
                              return
                          }

                          self?.tunnelManager = WireguardTunnelManager(manager: manager.manager)

                          resolve(true)
                      }
                  }
              }
          }
      }
  }

  @objc func generateWGKeyPair(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let wgKey = WireGuardKit.PrivateKey()
      let result: [String: String] = [
          "privateKey": wgKey.base64Key,
          "publicKey": wgKey.publicKey.base64Key
      ]
      resolve(result)
  }

  @objc func startVPN(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
        try tunnelManager?.startTunnel()
        resolve(true)
    } catch {
        reject("VPN_START_FAILED", "Failed to start VPN", error)
    }
  }

  @objc func stopVPN(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    tunnelManager?.stopTunnel()
    resolve(true)
  }
  
  @objc func getRuntimeStats(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
      loadTunnelManagerIfNeeded { loadedManager in
          guard let manager = loadedManager,
                let session = manager.connection as? NETunnelProviderSession else {
              reject("NO_SESSION", "Tunnel session not available", nil)
              return
          }

          do {
              try session.sendProviderMessage(Data([0])) { response in
                  guard let response = response else {
                      resolve(nil)
                      return
                  }

                  do {
                      if let raw = try JSONSerialization.jsonObject(with: response, options: []) as? [String: String],
                         let config = raw["config"] {

                          let lines = config.split(separator: "\n").map { $0.split(separator: "=") }
                          var info: [String: String] = [:]
                          for pair in lines {
                              if pair.count == 2 {
                                  info[String(pair[0])] = String(pair[1])
                              }
                          }

                          let handshake = Int(info["last_handshake_time_sec"] ?? "0") ?? 0
                          let tx = Int(info["tx_bytes"] ?? "0") ?? 0
                          let rx = Int(info["rx_bytes"] ?? "0") ?? 0
                          let endpoint = info["endpoint"] ?? "N/A"
                          let allowedIP = info["allowed_ip"] ?? "N/A"
                          let now = Int(Date().timeIntervalSince1970)
                          let uptime = (handshake > 0) ? now - handshake : 0

                          let result: [String: Any] = [
                              "status": (handshake > 0 && (tx > 0 || rx > 0)) ? "connected" : "disconnected",
                              "endpoint": endpoint,
                              "tx": tx,
                              "rx": rx,
                              "lastHandshake": handshake,
                              "uptime": uptime,
                              "allowedIP": allowedIP
                          ]

                          resolve(result)

                      } else {
                          resolve(nil)
                      }
                  } catch {
                      reject("JSON_PARSE_ERROR", "Failed to parse response", error)
                  }
              }
          } catch {
              reject("MESSAGE_SEND_FAILED", "Failed to send message", error)
          }
      }
  }

  private func loadTunnelManagerIfNeeded(_ completion: @escaping (WireguardTunnelManager?) -> Void) {
      if let manager = self.tunnelManager {
          completion(manager)
          return
      }

      NETunnelProviderManager.loadAllFromPreferences { managers, error in
          if let error = error {
              print("[VPN] Failed to load manager: \(error)")
              completion(nil)
              return
          }

          guard let manager = managers?.first else {
              print("[VPN] No manager found")
              completion(nil)
              return
          }

          self.tunnelManager = WireguardTunnelManager(manager: manager)
          completion(self.tunnelManager)
      }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }

}
