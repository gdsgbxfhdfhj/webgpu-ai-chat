class MiniAppBootstrap {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isInitialized = false;
    }

    initialize() {
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            this.setupTheme();
            this.setupViewport();
            this.setupBackButton();
            
            this.isInitialized = true;
        }
    }

    setupTheme() {
        if (!this.tg) return;

        const colorScheme = this.tg.colorScheme || 'light';
        document.documentElement.setAttribute('data-theme', colorScheme);
        
        if (this.tg.themeParams) {
            const root = document.documentElement;
            if (this.tg.themeParams.bg_color) {
                root.style.setProperty('--bg-primary', this.tg.themeParams.bg_color);
            }
            if (this.tg.themeParams.secondary_bg_color) {
                root.style.setProperty('--bg-secondary', this.tg.themeParams.secondary_bg_color);
            }
            if (this.tg.themeParams.text_color) {
                root.style.setProperty('--text-primary', this.tg.themeParams.text_color);
            }
            if (this.tg.themeParams.button_color) {
                root.style.setProperty('--bg-chat-user', this.tg.themeParams.button_color);
            }
        }
    }

    setupViewport() {
        if (!this.tg) return;
        
        const metaViewport = document.querySelector('meta[name=viewport]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
    }

    setupBackButton() {
        if (!this.tg) return;
        
        this.tg.BackButton.onClick(() => {
            window.dispatchEvent(new CustomEvent('miniapp:back'));
        });
    }

    showBackButton() {
        if (this.tg) {
            this.tg.BackButton.show();
        }
    }

    hideBackButton() {
        if (this.tg) {
            this.tg.BackButton.hide();
        }
    }

    showMainButton(text, onClick) {
        if (this.tg) {
            this.tg.MainButton.setText(text);
            this.tg.MainButton.onClick(onClick);
            this.tg.MainButton.show();
        }
    }

    hideMainButton() {
        if (this.tg) {
            this.tg.MainButton.hide();
        }
    }

    hapticFeedback(type = 'medium') {
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred(type);
        }
    }

    close() {
        if (this.tg) {
            this.tg.close();
        }
    }

    getInitData() {
        return this.tg?.initData || null;
    }

    getUser() {
        return this.tg?.initDataUnsafe?.user || null;
    }
}

export default new MiniAppBootstrap();