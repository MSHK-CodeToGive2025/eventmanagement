/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zubin': {
          'primary': '#f9ef1e',    // Main yellow color
          'secondary': '#ffff99',  // Light yellow color
          'dark': '#333333',      // Dark text color
          'light': '#fffff0',     // Light background color (ivory)
          'gray': '#666666',      // Secondary text color
          'accent': '#e6d800',    // Darker yellow for hover states
          'text': '#1a1a1a',      // Dark text for better contrast on yellow
        }
      },
      fontFamily: {
        'sans': ['Helvetica Neue', 'Arial', 'sans-serif'],
        'heading': ['Georgia', 'serif'],
      },
      spacing: {
        '128': '32rem',
      },
      container: {
        center: true,
        padding: '1rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 