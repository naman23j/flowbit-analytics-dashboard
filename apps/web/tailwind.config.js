/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Figma Design Colors
        primary: {
          DEFAULT: '#2B4DED', // Operations Blue
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2B4DED',
          600: '#2340c9',
          700: '#1d35a5',
        },
        chart: {
          operations: '#2B4DED',    // Blue
          marketing: '#FF9E69',     // Orange
          facilities: '#FFD1A7',    // Peach
          blue: '#2B4DED',
          orange: '#FF9E69',
          peach: '#FFD1A7',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
