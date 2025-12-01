import { getItem, setItem } from '../utils/storage.js';

class ThemeManager {
    constructor() {
        this.currentTheme = 'auto';
    }

    async initialize() {
        const savedTheme = await getItem('theme', 'settings') || 'auto';
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

    async setTheme(theme) {
        this.currentTheme = theme;
        await setItem('theme', theme, 'settings');

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

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

export default new ThemeManager();