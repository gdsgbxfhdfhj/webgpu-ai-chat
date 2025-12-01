class Modal {
    constructor() {
        this.modalRoot = null;
        this.currentModal = null;
    }

    initialize() {
        this.modalRoot = document.getElementById('modal-root');
    }

    show(title, content, onClose) {
        this.hide();

        const modalHTML = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" id="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        this.modalRoot.innerHTML = modalHTML;

        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close');

        closeBtn.addEventListener('click', () => {
            this.hide();
            if (onClose) onClose();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
                if (onClose) onClose();
            }
        });

        this.currentModal = overlay;
    }

    confirm(title, message, onConfirm, onCancel) {
        const content = `
            <p style="margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn-secondary" id="modal-cancel" style="flex: 1;">Cancel</button>
                <button class="btn-primary" id="modal-confirm" style="flex: 1;">Confirm</button>
            </div>
        `;

        this.show(title, content);

        setTimeout(() => {
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.hide();
                    if (onConfirm) onConfirm();
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hide();
                    if (onCancel) onCancel();
                });
            }
        }, 100);
    }

    alert(title, message, type = 'info') {
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const icon = iconMap[type] || iconMap.info;

        const content = `
            <div class="${type}-message">
                <p style="font-size: 1.1rem;">${icon} ${message}</p>
            </div>
            <button class="btn-primary" id="modal-ok" style="margin-top: 1rem;">OK</button>
        `;

        this.show(title, content);

        setTimeout(() => {
            const okBtn = document.getElementById('modal-ok');
            if (okBtn) {
                okBtn.addEventListener('click', () => this.hide());
            }
        }, 100);
    }

    hide() {
        if (this.modalRoot) {
            this.modalRoot.innerHTML = '';
            this.currentModal = null;
        }
    }
}

export default new Modal();