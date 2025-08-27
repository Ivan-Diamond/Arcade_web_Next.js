import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00FFFF',
          pink: '#FF10F0',
          purple: '#9D00FF',
          green: '#39FF14',
          yellow: '#FFFF00',
          orange: '#FF6600',
          blue: '#00B4D8',
        },
        dark: {
          bg: '#0A0E27',
          surface: '#151A3C',
          card: '#1E2344',
          border: '#2A3155',
        }
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'glitch': 'glitch 2s ease-in-out infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'neon-glow': {
          'from': { 
            textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF'
          },
          'to': {
            textShadow: '0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF, 0 0 50px #00FFFF'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'glitch': {
          '0%': { textShadow: '0.05em 0 0 #00fffc, -0.05em -0.025em 0 #fc00ff, 0.025em 0.05em 0 #fffc00' },
          '15%': { textShadow: '0.05em 0 0 #00fffc, -0.05em -0.025em 0 #fc00ff, 0.025em 0.05em 0 #fffc00' },
          '16%': { textShadow: '-0.05em -0.025em 0 #00fffc, 0.025em 0.025em 0 #fc00ff, -0.05em -0.05em 0 #fffc00' },
          '49%': { textShadow: '-0.05em -0.025em 0 #00fffc, 0.025em 0.025em 0 #fc00ff, -0.05em -0.05em 0 #fffc00' },
          '50%': { textShadow: '0.025em 0.05em 0 #00fffc, 0.05em 0 0 #fc00ff, 0 -0.05em 0 #fffc00' },
          '99%': { textShadow: '0.025em 0.05em 0 #00fffc, 0.05em 0 0 #fc00ff, 0 -0.05em 0 #fffc00' },
          '100%': { textShadow: '-0.025em 0 0 #00fffc, -0.025em -0.025em 0 #fc00ff, -0.025em -0.05em 0 #fffc00' }
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 16, 240, 0.5), 0 0 40px rgba(255, 16, 240, 0.3)',
        'neon-purple': '0 0 20px rgba(157, 0, 255, 0.5), 0 0 40px rgba(157, 0, 255, 0.3)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #fec1ea 100%)',
        'cyber-grid': "linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)",
      },
      fontFamily: {
        'mono': ['Roboto Mono', 'monospace'],
        'cyber': ['Orbitron', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

export default config
