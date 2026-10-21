Pod::Spec.new do |s|
  s.name             = 'HDWalletKit'
  s.version          = '0.3.6'
  s.summary          = 'Hierarchical Deterministic(HD) wallet for cryptocurrencies'

  s.description      = <<-DESC
Vendored copy of HDWalletKit 0.3.6. Upstream was last released in March 2020
and is incompatible with Swift 6.2: Foundation now defines `Data.bytes` as
`RawSpan`, which shadows CryptoSwift's `[UInt8]` version at every call site.
Vendored here so that fix lives in the repo and survives `pod install`,
mirroring how HDWalletKitBTC is already carried.
                       DESC

  s.homepage         = 'https://github.com/essentiaone/HDWallet'
  s.license          = { :type => 'MIT' }
  s.author           = { 'essentiaone' => 'https://github.com/essentiaone' }
  s.source           = { :git => 'https://github.com/essentiaone/HDWallet.git', :tag => s.version.to_s }

  s.ios.deployment_target = '12.0'

  s.source_files = 'HDWalletKit/**/*'

  s.dependency 'secp256k1.swift', '~> 0.1.4'
  s.dependency 'CryptoSwift', '~> 1.0.0'
end
