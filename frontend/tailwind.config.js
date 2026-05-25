/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        access: {
          granted: '#22c55e',
          denied: '#ef4444',
          warning: '#eab308',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
