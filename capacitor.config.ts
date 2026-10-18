import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native shell configuration. Platforms are generated on demand:
 *   npm run build && npx cap add ios && npx cap add android && npx cap sync
 *
 * Native-project checklist (not expressible here):
 *  - iOS Info.plist: no NSUserTrackingUsageDescription; UISupportedInterfaceOrientations = portrait only.
 *  - Android manifest: no INTERNET permission; android:screenOrientation="portrait".
 */
const config: CapacitorConfig = {
  appId: 'org.brambleandpip.ranger',
  appName: 'Bramble & Pip',
  webDir: 'dist',
  backgroundColor: '#1A1A24',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [], // zero external navigations
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1A1A24',
      showSpinner: false,
    },
  },
};

export default config;
