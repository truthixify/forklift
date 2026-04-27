import { type Theme } from '@rainbow-me/rainbowkit';

export const forkliftTheme: Theme = {
  blurs: {
    modalOverlay: 'none',
  },
  colors: {
    accentColor: 'hsl(232, 100%, 58%)',          // cobalt
    accentColorForeground: 'hsl(47, 83%, 97%)',   // paper
    actionButtonBorder: 'hsl(0, 0%, 4%)',         // ink
    actionButtonBorderMobile: 'hsl(0, 0%, 4%)',
    actionButtonSecondaryBackground: 'hsl(42, 27%, 88%)', // hairline
    closeButton: 'hsl(0, 0%, 4%)',
    closeButtonBackground: 'transparent',
    connectButtonBackground: 'hsl(47, 83%, 97%)', // paper
    connectButtonBackgroundError: 'hsl(11, 100%, 58%)', // alarm
    connectButtonInnerBackground: 'hsl(47, 83%, 97%)',
    connectButtonText: 'hsl(0, 0%, 4%)',          // ink
    connectButtonTextError: 'hsl(47, 83%, 97%)',
    connectionIndicator: 'hsl(79, 100%, 62%)',    // lime
    downloadBottomCardBackground: 'hsl(47, 83%, 97%)',
    downloadTopCardBackground: 'hsl(47, 83%, 97%)',
    error: 'hsl(11, 100%, 58%)',                  // alarm
    generalBorder: 'hsl(0, 0%, 4%)',              // ink
    generalBorderDim: 'hsl(42, 27%, 88%)',        // hairline
    menuItemBackground: 'hsl(42, 27%, 88%)',      // hairline
    modalBackdrop: 'rgba(10, 10, 10, 0.6)',       // ink/60
    modalBackground: 'hsl(47, 83%, 97%)',         // paper
    modalBorder: 'hsl(0, 0%, 4%)',                // ink
    modalText: 'hsl(0, 0%, 4%)',                  // ink
    modalTextDim: 'hsl(0, 0%, 42%)',              // muted-ink
    modalTextSecondary: 'hsl(0, 0%, 42%)',
    profileAction: 'hsl(42, 27%, 88%)',           // hairline
    profileActionHover: 'hsl(42, 27%, 82%)',
    profileForeground: 'hsl(47, 83%, 97%)',
    selectedOptionBorder: 'hsl(232, 100%, 58%)',  // cobalt
    standby: 'hsl(54, 100%, 50%)',                // hivis
  },
  fonts: {
    body: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  },
  radii: {
    actionButton: '0px',
    connectButton: '0px',
    menuButton: '0px',
    modal: '0px',
    modalMobile: '0px',
  },
  shadows: {
    connectButton: 'none',
    dialog: '12px 12px 0px 0px hsl(54, 100%, 50%)', // offset-shadow hivis
    profileDetailsAction: 'none',
    selectedOption: '0 0 0 2px hsl(232, 100%, 58%)',
    selectedWallet: '0 0 0 2px hsl(232, 100%, 58%)',
    walletLogo: 'none',
  },
};
