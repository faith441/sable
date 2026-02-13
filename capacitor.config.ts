import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f5127a6d261a4196af9d7ec4fa2eebbe',
  appName: 'Sable',
  webDir: 'dist',
  server: {
    url: 'https://f5127a6d-261a-4196-af9d-7ec4fa2eebbe.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
