//
//  CreateWalletBridge.m
//  WalletNativeDemo
//
//  Created by user on 02/03/23.
//

#import "CreateWalletBridge.h"

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CreateWallet, NSObject)

RCT_EXTERN_METHOD(generateMnemonics:(RCTResponseSenderBlock *)callback)
RCT_EXTERN_METHOD(generateAddressFromMnemonics:(NSString *) menmonicsString callback:(RCTResponseSenderBlock *)callback)

@end

@implementation CreateWalletBridge

@end
