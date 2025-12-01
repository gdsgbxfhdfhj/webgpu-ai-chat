class UIRenderer {
    constructor() {
        this.currentPage = 'chat';
        this.contentArea = null;
    }

    initialize() {
        this.contentArea = document.getElementById('content-area');
        this.setupNavigation();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                this.navigateTo(page);
                
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    navigateTo(pageName) {
        this.currentPage = pageName;
        
        const event = new CustomEvent('page:change', { 
            detail: { page: pageName } 
        });
        window.dispatchEvent(event);
    }

    renderPage(pageContent) {
        if (this.contentArea) {
            this.contentArea.innerHTML = '';
            
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page active';
            pageDiv.innerHTML = pageContent;
            
            this.contentArea.appendChild(pageDiv);
        }
    }

    showLoading(show, text = 'Loading...', progress = 0) {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.getElementById('loading-text');
        const loadingBar = document.getElementById('loading-bar');
        const loadingStatus = document.getElementById('loading-status');

        if (show) {
            loadingScreen.style.display = 'flex';
            if (loadingText) loadingText.textContent = text;
            if (loadingBar) loadingBar.style.width = `${progress}%`;
            if (loadingStatus) loadingStatus.textContent = progress > 0 ? `${progress}%` : '';
        } else {
            loadingScreen.style.display = 'none';
        }
    }

    showMainView() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainView = document.getElementById('main-view');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainView) mainView.classList.remove('hidden');
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

export default new UIRenderer();