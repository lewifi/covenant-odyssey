import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';

SplashScreen.preventAutoHideAsync();

// Covenant Odyssey is a single full-bleed cinematic screen - no tabs, no
// headers, no template chrome. The GameScreen owns the whole viewport.
export default function RootLayout() {
  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: 'Covenant Odyssey - Divergent Prophecies',
        contentStyle: { backgroundColor: '#0A0A0C' },
      }}
    />
  );
}
