import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        valo: {
          bg: '#0F1923',
          red: '#FF4655',
          white: '#ECE8E1',
          gray: '#768079',
          panel: '#1a2530',
        },
      },
    },
  },
  plugins: [],
}

export default config
