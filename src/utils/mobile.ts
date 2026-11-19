import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initNativeShell(darkMode: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: darkMode ? '#0D1510' : '#0B5D34',
      });
    }
  } catch {
    // Ignore unsupported platform errors
  }
  try {
    await SplashScreen.hide();
  } catch {
    // Ignore if already hidden
  }
}

export async function syncNativeStatusBar(darkMode: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: darkMode ? '#0D1510' : '#0B5D34',
      });
    }
  } catch {
    // Ignore unsupported platform errors
  }
}

export async function getInitialNetworkConnected(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      // Fall back to navigator.onLine
    }
  }
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function subscribeNetworkStatus(
  onChange: (connected: boolean) => void
): () => void {
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  let capHandle: { remove: () => Promise<void> } | null = null;
  if (Capacitor.isNativePlatform()) {
    Network.addListener('networkStatusChange', (status) => {
      onChange(status.connected);
    })
      .then((handle) => {
        capHandle = handle;
      })
      .catch(() => {});
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (capHandle) {
      capHandle.remove().catch(() => {});
    }
  };
}

export function subscribeNativeBackButton(onBack: () => boolean): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  let capHandle: { remove: () => Promise<void> } | null = null;

  CapApp.addListener('backButton', ({ canGoBack }) => {
    const handled = onBack();
    if (!handled && !canGoBack) {
      CapApp.exitApp().catch(() => {});
    }
  })
    .then((handle) => {
      capHandle = handle;
    })
    .catch(() => {});

  return () => {
    if (capHandle) {
      capHandle.remove().catch(() => {});
    }
  };
}

export async function readNativeStorage(key: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

export async function writeNativeStorage(key: string, value: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Preferences.set({ key, value });
  } catch {
    // Ignore native preference write errors
  }
}

export async function removeNativeStorage(key: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Preferences.remove({ key });
  } catch {
    // Ignore native preference remove errors
  }
}
