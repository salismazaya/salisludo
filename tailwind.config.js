/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        playerRed: '#EF4444',
        playerGreen: '#10B981',
        playerYellow: '#F59E0B',
        playerBlue: '#3B82F6',
        playerPurple: '#8B5CF6',
        playerOrange: '#F97316'
      }
    }
  },
  plugins: []
};
