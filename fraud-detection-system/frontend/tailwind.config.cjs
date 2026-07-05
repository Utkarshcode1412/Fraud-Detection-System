module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0D1117',
          raised: '#141A23',
          overlay: '#1B222D',
          border: '#242C38',
        },
        ink: {
          DEFAULT: '#E6E9EF',
          muted: '#8A93A3',
          faint: '#5B6473',
        },
        signal: {
          safe: '#2DD4BF',
          low: '#60A5FA',
          medium: '#F5A623',
          high: '#FB7185',
          critical: '#EF4444',
        },
        brand: {
          DEFAULT: '#4F7CFF',
          dim: '#2C4A9E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
};
