/**
 * QuotaManager - WebGPU Memory and Storage Quota Management
 * CSP-safe, production-ready quota tracking for AI model management
 * @module core/quotaManager
 */

class QuotaManager {
    constructor() {
        this.initialized = false;
        this.gpuSupported = false;
        this.gpu = null;
        this.adapter = null;
        this.limits = null;

        this.models = new Map(); // modelName → { sizeMB }
        this.modelAccessOrder = []; // LRU tracking

        this.maxGPUMemoryMB = 0;
        this.currentGPUUsageMB = 0;

        this.storageQuota = 0;
        this.storageUsage = 0;

        this.cacheDirectoryName = 'ai-model-cache';
    }

    /** Initialize GPU + Storage quota */
    async init() {
        if (this.initialized) return;

        await this._detectGPU();
        await this._detectStorage();

        this.initialized = true;
    }

    /** Detect GPU capabilities */
    async _detectGPU() {
        if (!('gpu' in navigator)) {
            this.gpuSupported = false;
            return;
        }

        try {
            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) {
                this.gpuSupported = false;
                return;
            }

            this.limits = this.adapter.limits;
            this.gpuSupported = true;

            // Approximate GPU memory budget (browser hides exact value)
            this.maxGPUMemoryMB = Math.floor(
                (this.limits.maxStorageBufferBindingSize || 256_000_000) / 1_000_000
            );

        } catch {
            this.gpuSupported = false;
        }
    }

    /** Detect browser storage quota */
    async _detectStorage() {
        if (!navigator.storage || !navigator.storage.estimate) return;

        try {
            const { quota, usage } = await navigator.storage.estimate();
            this.storageQuota = Math.floor(quota / 1_000_000);
            this.storageUsage = Math.floor(usage / 1_000_000);
        } catch {
            this.storageQuota = 0;
            this.storageUsage = 0;
        }
    }

    /** Register model usage */
    registerModel(name, sizeMB) {
        this.models.set(name, { sizeMB });
        this._touchModel(name);
        this.currentGPUUsageMB += sizeMB;
    }

    /** Mark as used for LRU */
    _touchModel(name) {
        const idx = this.modelAccessOrder.indexOf(name);
        if (idx !== -1) this.modelAccessOrder.splice(idx, 1);
        this.modelAccessOrder.push(name);
    }

    /** Evict least-used model */
    evictModel() {
        if (this.modelAccessOrder.length === 0) return null;

        const oldest = this.modelAccessOrder.shift();
        const info = this.models.get(oldest);

        if (info) {
            this.currentGPUUsageMB -= info.sizeMB;
        }

        this.models.delete(oldest);
        return oldest;
    }

    /** Request GPU memory */
    requestMemory(sizeMB) {
        if (!this.gpuSupported) return true;

        while (this.currentGPUUsageMB + sizeMB > this.maxGPUMemoryMB) {
            const evicted = this.evictModel();
            if (!evicted) return false;
        }

        return true;
    }

    /** Storage usage check */
    canStore(sizeMB) {
        return this.storageUsage + sizeMB <= this.storageQuota;
    }
}

const quotaManager = new QuotaManager();
export default quotaManager;
