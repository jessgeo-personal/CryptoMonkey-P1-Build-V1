// ============================================
// COLOR SYSTEM - CryptoMonkey Design Tokens
// Supports light and dark mode
// ============================================

export const Colors = {
  light: {
    // Background colors
    background: '#FCFCF9',      // cream-50
    surface: '#FFFFFD',         // cream-100
    
    // Text colors
    text: '#134252',            // slate-900
    textSecondary: '#626C71',   // slate-500
    
    // Primary brand
    primary: '#21808D',         // teal-500
    primaryHover: '#1D7480',    // teal-600
    primaryActive: '#1A6873',   // teal-700
    
    // Secondary
    secondary: 'rgba(94, 82, 64, 0.12)',  // brown-600 with opacity
    secondaryHover: 'rgba(94, 82, 64, 0.2)',
    secondaryActive: 'rgba(94, 82, 64, 0.25)',
    
    // Status colors
    success: '#21808D',         // teal-500
    error: '#C0152F',           // red-500
    warning: '#A84B2F',         // orange-500
    info: '#626C71',            // slate-500
    
    // UI elements
    border: 'rgba(94, 82, 64, 0.2)',
    cardBorder: 'rgba(94, 82, 64, 0.12)',
    shadow: 'rgba(0, 0, 0, 0.04)',
    
    // Chart/Category backgrounds
    bg1: 'rgba(59, 130, 246, 0.08)',    // Light blue
    bg2: 'rgba(245, 158, 11, 0.08)',    // Light yellow
    bg3: 'rgba(34, 197, 94, 0.08)',     // Light green
    bg4: 'rgba(239, 68, 68, 0.08)',     // Light red
    bg5: 'rgba(147, 51, 234, 0.08)',    // Light purple
    bg6: 'rgba(249, 115, 22, 0.08)',    // Light orange
    bg7: 'rgba(236, 72, 153, 0.08)',    // Light pink
    bg8: 'rgba(6, 182, 212, 0.08)',     // Light cyan
  },
  
  dark: {
    // Background colors
    background: '#1F2121',      // charcoal-700
    surface: '#262828',         // charcoal-800
    
    // Text colors
    text: '#F5F5F5',            // gray-200
    textSecondary: 'rgba(167, 169, 169, 0.7)',  // gray-300 with opacity
    
    // Primary brand
    primary: '#32B8C6',         // teal-300
    primaryHover: '#2DA6B2',    // teal-400
    primaryActive: '#2996A1',   // teal-800
    
    // Secondary
    secondary: 'rgba(119, 124, 124, 0.15)',  // gray-400 with opacity
    secondaryHover: 'rgba(119, 124, 124, 0.25)',
    secondaryActive: 'rgba(119, 124, 124, 0.3)',
    
    // Status colors
    success: '#32B8C6',         // teal-300
    error: '#FF5459',           // red-400
    warning: '#E68161',         // orange-400
    info: '#A7A9A9',            // gray-300
    
    // UI elements
    border: 'rgba(119, 124, 124, 0.3)',
    cardBorder: 'rgba(119, 124, 124, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    
    // Chart/Category backgrounds
    bg1: 'rgba(29, 78, 216, 0.15)',     // Dark blue
    bg2: 'rgba(180, 83, 9, 0.15)',      // Dark yellow
    bg3: 'rgba(21, 128, 61, 0.15)',     // Dark green
    bg4: 'rgba(185, 28, 28, 0.15)',     // Dark red
    bg5: 'rgba(107, 33, 168, 0.15)',    // Dark purple
    bg6: 'rgba(194, 65, 12, 0.15)',     // Dark orange
    bg7: 'rgba(190, 24, 93, 0.15)',     // Dark pink
    bg8: 'rgba(8, 145, 178, 0.15)',     // Dark cyan
  },
} as const;

export type ColorScheme = 'light' | 'dark';
