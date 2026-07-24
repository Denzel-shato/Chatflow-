export function useSystemTheme() {
    return true
  }
  
  export const chatTheme = (dark) => ({
    // Backgrounds
    page:         dark ? '#0f0620' : '#e8e4f0',
    surface:      dark ? '#1a0a35' : '#f0edf8',
    surfaceHover: dark ? '#22124a' : '#e8e4f2',
    header:       dark ? '#160830' : '#ece9f5',
    input:        dark ? '#1a0a35' : '#e8e4f0',
    inputFocus:   dark ? '#22124a' : '#ede9f6',
  
    // Bubbles
    myBubble:     'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    theirBubble:  dark ? '#1f1040' : '#ddd8ee',
    theirBorder:  dark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)',
  
    // Borders
    border:       dark ? 'rgba(139,92,246,0.2)'  : 'rgba(139,92,246,0.18)',
    borderHover:  dark ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.38)',
    borderFocus:  dark ? 'rgba(139,92,246,0.6)'  : 'rgba(139,92,246,0.5)',
    divider:      dark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.12)',
  
    // Text
    textPrimary:  dark ? '#f3f0ff'                : '#1e0a3c',
    textSecondary:dark ? 'rgba(243,240,255,0.55)' : 'rgba(30,10,60,0.55)',
    textMuted:    dark ? 'rgba(243,240,255,0.35)' : 'rgba(30,10,60,0.38)',
    textAccent:   dark ? '#c4b5fd'                : '#6d28d9',
    myText:       '#ffffff',
    theirText:    dark ? '#f3f0ff' : '#1e0a3c',
    timeOnMine:   'rgba(255,255,255,0.6)',
    timeOnTheirs: dark ? 'rgba(243,240,255,0.4)' : 'rgba(30,10,60,0.38)',
  
    // Icon
    icon:         dark ? '#a78bfa' : '#6d28d9',
    iconMuted:    dark ? 'rgba(167,139,250,0.4)' : 'rgba(109,40,217,0.35)',
  
    // Shadows
    shadow:       dark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 2px 12px rgba(109,40,217,0.1)',
    shadowHover:  dark ? '0 4px 20px rgba(139,92,246,0.2)' : '0 4px 16px rgba(109,40,217,0.14)',
    menuShadow:   dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(109,40,217,0.15)',
    bubbleShadow: dark ? '0 4px 16px rgba(109,40,217,0.4)' : '0 4px 14px rgba(109,40,217,0.25)',
  })