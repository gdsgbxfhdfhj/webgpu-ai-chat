import { themeManager } from './themeManager.js';
import { quotaManager } from '../core/quotaManager.js';
import { memoryEngine } from '../core/memoryEngine.js';
import { storage } from '../utils/storage.js';
import { fileExport } from '../utils/fileExport.js';
import { eventBus } from '../utils/events.js';
import { modal } from './modal.js';
import { modelLoader } from '../core/modelLoader.js';

class SettingsUI {
    async render() {
        const theme = themeManager.getTheme();
        const autoExport = storage.getItem('autoExport') || false;
        const currentModel = modelLoader.getCurrentModel() || 'Not loaded';
        const modelConfig = modelLoader.getModelConfig();

        const html = `
            <div class="settings-container">
                <h2 style="margin-bottom: 1.5rem;">Settings</h2>

                <div class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <span class="setting-label">Theme</span>
                        <select class="select-field" id="theme-select">
                            <option value="auto" ${theme === 'auto' ? 'selected' : ''}>Auto</option>
                            <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Model</h3>
                    <div class="setting-item">
                        <span class="setting-label">Current Model</span>
                        <select class="select-field" id="model-select">
                            <option value="${modelConfig.default}">Qwen 0.5B (Fast, 300MB)</option>
                            <option value="${modelConfig.balanced}">Qwen 1.5B (Balanced, 900MB)</option>
                            <option value="${modelConfig.lite}">TinyLlama (Lite, 600MB)</option>
                        </select>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        Current: ${currentModel}<br>
                        ⚠️ Changing model requires reload
                    </p>
                </div>

                <div class="settings-section">
                    <h3>Data & Privacy</h3>
                    <div class="setting-item">
                        <span class="setting-label">Auto-export chats</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="auto-export-toggle" ${autoExport ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Export all chats</span>
                        <div>
                            <button class="btn-secondary" id="export-txt-btn">TXT</button>
                            <button class="btn-secondary" id="export-json-btn">JSON</button>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Clear all data</span>
                        <button class="btn-secondary" id="clear-data-btn">Clear</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Quota</h3>
                    <div class="setting-item">
                        <span class="setting-label">Daily messages</span>
                        <span id="quota-display">Loading...</span>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Reset quota (debug)</span>
                        <button class="btn-secondary" id="reset-quota-btn">Reset</button>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    async afterRender() {
        this.updateQuotaDisplay();
        this.setupEventListeners();
    }

    updateQuotaDisplay() {
        const quotaStatus = quotaManager.getQuotaStatus();
        const display = document.getElementById('quota-display');
        if (display) {
            display.textContent = `${quotaStatus.remain}/${quotaStatus.free}`;
        }
    }

    setupEventListeners() {
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                themeManager.setTheme(e.target.value);
            });
        }

        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            const currentModel = modelLoader.getCurrentModel();
            if (currentModel) {
                modelSelect.value = currentModel;
            }
            
            modelSelect.addEventListener('change', (e) => {
                storage.setItem('preferredModel', e.target.value);
                modal.confirm(
                    'Reload Required',
                    'The model will be changed on next app reload. Reload now?',
                    () => {
                        window.location.reload();
                    }
                );
            });
        }

        const autoExportToggle = document.getElementById('auto-export-toggle');
        if (autoExportToggle) {
            autoExportToggle.addEventListener('change', (e) => {
                storage.setItem('autoExport', e.target.checked);
            });
        }

        const exportTxtBtn = document.getElementById('export-txt-btn');
        if (exportTxtBtn) {
            exportTxtBtn.addEventListener('click', () => {
                this.handleExportTXT();
            });
        }

        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.handleExportJSON();
            });
        }

        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.handleClearData();
            });
        }

        const resetQuotaBtn = document.getElementById('reset-quota-btn');
        if (resetQuotaBtn) {
            resetQuotaBtn.addEventListener('click', () => {
                this.handleResetQuota();
            });
        }
    }

    handleExportTXT() {
        fileExport.exportToTXT();
        eventBus.emit('modal:show', {
            title: '✅ Success',
            content: 'Chats exported as TXT file!',
            type: 'success'
        });
    }

    handleExportJSON() {
        fileExport.exportToJSON();
        eventBus.emit('modal:show', {
            title: '✅ Success',
            content: 'Chats exported as JSON file!',
            type: 'success'
        });
    }

    handleClearData() {
        modal.confirm(
            'Clear All Data',
            'This will delete all conversations and settings. This cannot be undone. Are you sure?',
            () => {
                storage.clearAll();
                window.location.reload();
            }
        );
    }

    handleResetQuota() {
        quotaManager.resetQuota();
        eventBus.emit('modal:show', {
            title: '✅ Success',
            content: 'Daily quota has been reset!',
            type: 'success'
        });
        this.updateQuotaDisplay();
    }
}

export const settingsUI = new SettingsUI();