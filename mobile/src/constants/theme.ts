/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// @ts-ignore
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#ffffff',
    background: '#10161c',
    backgroundElement: 'rgba(255, 255, 255, 0.08)',
    backgroundSelected: 'rgba(255, 255, 255, 0.14)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    brand: '#2f7d46',
    brandStrong: '#25693a',
    brandSoft: '#9bd8aa',
    accent: '#315f72',
    accentWarm: '#d6a650',
    border: 'rgba(255, 255, 255, 0.12)',
    surface: 'rgba(255, 255, 255, 0.1)',
  },
  dark: {
    text: '#ffffff',
    background: '#10161c',
    backgroundElement: 'rgba(255, 255, 255, 0.08)',
    backgroundSelected: 'rgba(255, 255, 255, 0.14)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    brand: '#2f7d46',
    brandStrong: '#25693a',
    brandSoft: '#9bd8aa',
    accent: '#315f72',
    accentWarm: '#d6a650',
    border: 'rgba(255, 255, 255, 0.12)',
    surface: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
