#import "AppDelegate.h"
#import "ScreenshotDelegate.h"
#import <Firebase.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@interface AppDelegate ()
@property(nonatomic, assign) BOOL isOverlayScheduled;
@property(nonatomic, strong) UIImageView *overlayImageView;
@property(nonatomic, strong) ScreenshotDelegate *screenshot;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Clear Keychain if needed
  ClearKeychainIfNecessary();

  // Firebase setup
  [FIRApp configure];

  // Set React Native module name
  self.moduleName = @"qubetics_app";

  // Set the dependency provider (required for using .m files in latest RN)
  self.dependencyProvider = [RCTAppDependencyProvider new];

  // Set initial props if any
  self.initialProps = @{};

  [NSNotificationCenter.defaultCenter
      addObserverForName:UIApplicationUserDidTakeScreenshotNotification
                  object:nil
                   queue:nil
              usingBlock:^(NSNotification *note) {
                NSLog(@"Screenshot taken");
                [self.screenshot sendScreenshotEvent];
              }];

  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(handleAppWillResignActive)
             name:UIApplicationWillResignActiveNotification
           object:nil];

  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(handleAppDidBecomeActive)
             name:UIApplicationDidBecomeActiveNotification
           object:nil];

  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(handleAppDidEnterBackground)
             name:UIApplicationDidEnterBackgroundNotification
           object:nil];

  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(handleAppWillEnterForeground)
             name:UIApplicationWillEnterForegroundNotification
           object:nil];

  self.screenshot = [ScreenshotDelegate allocWithZone:nil];

  // Call super (which sets up the RN bridge and root view automatically)
  return [super application:application
      didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:
                (NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options {
  return [RCTLinkingManager application:application
                                openURL:url
                                options:options];
}

- (BOOL)application:(UIApplication *)application
    continueUserActivity:(nonnull NSUserActivity *)userActivity
      restorationHandler:
          (nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))
              restorationHandler {
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

#pragma mark - App Lifecycle Event Handlers

- (void)handleAppWillResignActive {
  self.isOverlayScheduled = YES;
  dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)),
      dispatch_get_main_queue(), ^{
        if (self.isOverlayScheduled &&
            [UIApplication sharedApplication].applicationState !=
                UIApplicationStateActive) {
          [self showOverlay];
          [self sendEventToJS:@"onAppBackground"];
        }
      });
}

- (void)handleAppDidBecomeActive {
  self.isOverlayScheduled = NO;
  [self hideOverlay];
  [self sendEventToJS:@"onAppForeground"];
}

- (void)handleAppDidEnterBackground {
  self.isOverlayScheduled = NO;
  [self showOverlay];
  [self sendEventToJS:@"onAppBackground"];
}

- (void)handleAppWillEnterForeground {
  self.isOverlayScheduled = NO;
  [self hideOverlay];
  [self sendEventToJS:@"onAppForeground"];
}

- (void)showOverlay {
  if (!self.overlayImageView) {
    UIImage *overlayImage = [UIImage imageNamed:@"OverlayImage"];
    self.overlayImageView =
        [[UIImageView alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.overlayImageView.image = overlayImage;
    self.overlayImageView.contentMode = UIViewContentModeScaleAspectFill;
  }
  [self.window addSubview:self.overlayImageView];
}

- (void)hideOverlay {
  [self.overlayImageView removeFromSuperview];
}

- (void)sendEventToJS:(NSString *)eventName {
  RCTBridge *bridge =
      [(RCTRootView *)self.window.rootViewController.view bridge];
  if (bridge) {
    [bridge.eventDispatcher sendAppEventWithName:eventName body:@{}];
  }
}

- (NSString *)stringForApplicationState:(UIApplicationState)state {
  switch (state) {
  case UIApplicationStateActive:
    return @"Active";
  case UIApplicationStateInactive:
    return @"Inactive";
  case UIApplicationStateBackground:
    return @"Background";
  default:
    return @"Unknown";
  }
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [self bundleURL];
}

- (NSURL *)bundleURL {
#if DEBUG
  return
      [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main"
                                 withExtension:@"jsbundle"];
#endif
}
static void ClearKeychainIfNecessary() {
  // Checks wether or not this is the first time the app is run
  if ([[NSUserDefaults standardUserDefaults] boolForKey:@"HAS_RUN_BEFORE"] ==
      NO) {
    // Set the appropriate value so we don't clear next time the app is launched
    [[NSUserDefaults standardUserDefaults] setBool:YES
                                            forKey:@"HAS_RUN_BEFORE"];

    NSArray *secItemClasses = @[
      (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecClassInternetPassword, (__bridge id)kSecClassCertificate,
      (__bridge id)kSecClassKey, (__bridge id)kSecClassIdentity
    ];

    // Maps through all Keychain classes and deletes all items that match
    for (id secItemClass in secItemClasses) {
      NSDictionary *spec = @{(__bridge id)kSecClass : secItemClass};
      SecItemDelete((__bridge CFDictionaryRef)spec);
    }
  }
}
@end
