import type { Config } from 'tailwindcss'
import { colors, fontFamily } from './lib/design-tokens'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily,
    },
  },
  plugins: [],
}

export default config
