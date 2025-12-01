import modelLoader from './core/modelLoader.js';
import personaEngine from './core/personaEngine.js';
import quotaManager from './core/quotaManager.js';
import miniappBootstrap from './core/miniappBootstrap.js';
import uiRenderer from './ui/uiRenderer.js';
import chatUI from './ui/chatUI.js';
import personaUI from './ui/personaUI.js';
import settingsUI from './ui/settingsUI.js';
import modal from './ui/modal.js';
import themeManager from './ui/themeManager.js';
import { on, emit } from './utils/events.js';
import { getItem } from './utils/storage.js';

class App {
    constructor() {
        this.pages = {
            chat: chatUI,
            personas: personaUI,
            settings: settingsUI,
            about: this.getAboutUI()
        };
        this.isModelLoaded = false;
    }

    async initialize() {
        console.log('[LIFECYCLE] app-start');
        
        miniappBootstrap.initialize();
        await themeManager.initialize();
        modal.initialize();
        uiRenderer.initialize();

        this.setupEventListeners();
        this.registerServiceWorker();
        
        await this.loadModel();
        
        await this.showPage('chat');
    }

    async loadModel() {
        try {
            const preferredModel = await getItem('preferredModel', 'settings') || 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
            
            await modelLoader.loadModel(preferredModel, (progress) => {
                uiRenderer.showLoading(true, progress.text, progress.progress);
            });

            this.isModelLoaded = true;
            uiRenderer.showMainView();
            
        } catch (error) {
            console.error('[APP] Model loading failed:', error);
            uiRenderer.showMainView();
            
            modal.alert(
                'Initialization Error',
                error.message || 'Failed to load AI model. Some features may not work.',
                'error'
            );
        }
    }

    setupEventListeners() {
        on('page:change', async (data) => {
            await this.showPage(data.page);
        });

        on('page:refresh', async () => {
            await this.showPage(uiRenderer.getCurrentPage());
        });

        on('persona:changed', async () => {
            await this.showPage('chat');
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === 'chat') {
                    btn.classList.add('active');
                }
            });
        });

        on('modal:show', (data) => {
            modal.alert(data.title, data.content, data.type || 'info');
        });
    }

    async showPage(pageName) {
        const pageUI = this.pages[pageName];
        
        if (pageUI) {
            const content = typeof pageUI.render === 'function' 
                ? await pageUI.render() 
                : pageUI;
            
            uiRenderer.renderPage(content);
            
            if (typeof pageUI.afterRender === 'function') {
                setTimeout(async () => await pageUI.afterRender(), 50);
            }
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/src/service-worker.js')
                .then(reg => {
                    console.log('[SW] Registered:', reg);
                })
                .catch(err => {
                    console.warn('[SW] Registration failed:', err);
                });
        }
    }

    getAboutUI() {
        return {
            render: () => `
                <div class="about-content">
                    <div class="about-logo">🤖</div>
                    <h2>AI Chat</h2>
                    <p>Version 1.0.0</p>
                    
                    <div class="feature-list">
                        <h3 style="margin-bottom: 0.75rem;">Features</h3>
                        <ul>
                            <li>✅ 100% on-device AI processing</li>
                            <li>✅ Multiple AI personalities</li>
                            <li>✅ WebGPU-powered inference</li>
                            <li>✅ Complete privacy - no servers</li>
                            <li>✅ Works offline after first load</li>
                            <li>✅ Custom persona creation</li>
                            <li>✅ Chat export (TXT/JSON)</li>
                            <li>✅ IndexedDB storage</li>
                            <li>✅ Tamper-resistant quota</li>
                        </ul>
                    </div>

                    <div class="settings-section" style="margin-top: 1.5rem;">
                        <h3>Technology</h3>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            Powered by WebLLM and WebGPU. All AI inference happens 
                            directly on your device using your GPU. Your conversations 
                            are stored locally in IndexedDB and never leave your device.
                        </p>
                    </div>

                    <div class="settings-section">
                        <h3>Requirements</h3>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            Chrome 113+, Edge 113+, or Safari 18+<br>
                            WebGPU-capable device<br>
                            ~1GB free storage for model cache
                        </p>
                    </div>

                    <div class="settings-section">
                        <h3>Model Information</h3>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            Default: Qwen2.5-0.5B (~300MB)<br>
                            Current: ${modelLoader.getCurrentModel() || 'Not loaded'}<br>
                            Change model in Settings
                        </p>
                    </div>
                </div>
            `
        };
    }
}

const app = new App();
app.initialize().catch(error => {
    console.error('[APP] Initialization failed:', error);
});