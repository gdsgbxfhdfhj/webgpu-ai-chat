import { storage } from '../utils/storage.js';

class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
    }

    async initialize() {
        const savedTheme = storage.getItem('theme') || 'auto';
        this.setTheme(savedTheme);
        this.setupMediaQuery();
    }

    setupMediaQuery() {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        storage.setItem('theme', theme);

        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(isDark ? 'dark' : 'light');
        } else {
            this.applyTheme(theme);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}

export const themeManager = new ThemeManager();