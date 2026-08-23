/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // AI Esnaf marka paleti — src/core/theme/designSystem.js ile birebir
      // aynı değerler. (Not: NativeWind v2 CSS custom property okuyamadığı
      // için burada literal hex tekrar tanımlanır; iki dosya arasında
      // tutarlılık manuel korunmalıdır.)
      colors: {
        background: '#17151A',
        surface: '#201D24',
        'surface-elevated': '#2A2631',
        primary: '#FF7A59',       // Mercan — asistanın/AI'ın kendi rengi
        secondary: '#22B573',     // Zümrüt — muhasebe/finans
        tertiary: '#C2478D',      // Orkide — sosyal medya
        'text-primary': '#F6F1EC',
        'text-secondary': '#A79E96',
        success: '#22B573',
        warning: '#F59E0B',
        error: '#EF4444',
        glassBorder: 'rgba(255, 247, 240, 0.1)',
        glassBg: 'rgba(255, 247, 240, 0.03)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        geist: ['Geist', 'monospace'],
        'label-md': ['Geist', 'sans-serif'],
        'headline-sm': ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif']
      },
      fontSize: {
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-lg-mobile': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }]
      },
      borderRadius: {
        'bento': '24px',
        'glass': '16px',
        'small': '12px',
        'large': '20px',
      },
      spacing: {
        'stack-sm': '8px',
        'glass-padding': '20px',
        'bento-gap': '12px',
        'stack-md': '16px',
        'stack-lg': '24px',
        'container-margin': '20px'
      }
    },
  },
  plugins: [],
}
