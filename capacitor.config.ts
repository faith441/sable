import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.getsable.wardrobe',
  appName: 'Sable.ai',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#F5F0EB',
    scrollEnabled: true
  },
  android: {
    backgroundColor: '#1a1a1a'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
