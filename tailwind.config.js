/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e293b', // Bleu Nuit
                secondary: '#fbbf24', // Or
            }
        },
    },
    plugins: [],
}
