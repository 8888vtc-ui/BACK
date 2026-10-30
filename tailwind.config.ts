import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
                serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
            },
        },
    },
    plugins: [],
};

export default config;
