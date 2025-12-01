import { openDB } from '../utils/storage.js';

class QuotaManager {
    constructor() {
        this.dailyLimit = 20;
        this.initialized = false;
    }

    async initQuota(dailyLimit = 20) {
        this.dailyLimit = dailyLimit;
        
        const today = new Date().toDateString();
        const db = await openDB();
        
        const tx = db.transaction(['quota'], 'readwrite');
        const store = tx.objectStore('quota');
        
        const dateRecord = await this.getQuotaRecord(store, 'date');
        const usedRecord = await this.getQuotaRecord(store, 'used');
        const digestRecord = await this.getQuotaRecord(store, 'digest');
        
        if (!dateRecord || dateRecord.value !== today) {
            await store.put({ key: 'date', value: today });
            await store.put({ key: 'used', value: 0 });
            await store.put({ key: 'digest', value: await this.computeDigest(today, 0) });
        } else {
            const used = usedRecord?.value || 0;
            const expectedDigest = await this.computeDigest(dateRecord.value, used);
            
            if (digestRecord?.value !== expectedDigest) {
                console.warn('[QUOTA] Tampering detected, resetting quota conservatively');
                await store.put({ key: 'used', value: this.dailyLimit });
                await store.put({ key: 'digest', value: await this.computeDigest(today, this.dailyLimit) });
            }
        }
        
        await tx.done;
        this.initialized = true;
        
        console.log('[LIFECYCLE] quota-initialized');
    }

    async getQuotaRecord(store, key) {
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async computeDigest(date, used) {
        const fingerprint = this.getDeviceFingerprint();
        const data = `${date}:${used}:${fingerprint}:salt_2024`;
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getDeviceFingerprint() {
        let fingerprint = localStorage.getItem('device_fingerprint');
        if (!fingerprint) {
            fingerprint = this.generateFingerprint();
            localStorage.setItem('device_fingerprint', fingerprint);
        }
        return fingerprint;
    }

    generateFingerprint() {
        const nav = navigator;
        const screen = window.screen;
        const components = [
            nav.userAgent,
            nav.language,
            screen.width,
            screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            !!window.sessionStorage,
            !!window.localStorage
        ];
        return btoa(components.join('|')).slice(0, 32);
    }

    async consumeQuota(n = 1) {
        if (!this.initialized) {
            await this.initQuota();
        }

        const db = await openDB();
        const tx = db.transaction(['quota'], 'readwrite');
        const store = tx.objectStore('quota'); // تصحیح شد: 'quota' به جای quota'
        
        const usedRecord = await this.getQuotaRecord(store, 'used');
        const dateRecord = await this.getQuotaRecord(store, 'date');
        
        const used = usedRecord?.value || 0;
        const remain = this.dailyLimit - used;
        
        if (remain < n) {
            await tx.done;
            console.log('[LIFECYCLE] quota-consumed', { ok: false, remain: 0 });
            return { ok: false, remain: 0 };
        }
        
        const newUsed = used + n;
        await store.put({ key: 'used', value: newUsed });
        await store.put({ key: 'digest', value: await this.computeDigest(dateRecord.value, newUsed) });
        
        await tx.done;
        
        const newRemain = this.dailyLimit - newUsed;
        console.log('[LIFECYCLE] quota-consumed', { ok: true, remain: newRemain });
        return { ok: true, remain: newRemain };
    }

    async getQuotaStatus() {
        if (!this.initialized) {
            await this.initQuota();
        }

        const db = await openDB();
        const tx = db.transaction(['quota'], 'readonly');
        const store = tx.objectStore('quota');
        
        const usedRecord = await this.getQuotaRecord(store, 'used');
        await tx.done;
        
        const used = usedRecord?.value || 0;
        const free = this.dailyLimit;
        const remain = free - used;
        
        return { used, free, remain: Math.max(0, remain) };
    }

    async resetQuota() {
        const today = new Date().toDateString();
        const db = await openDB();
        const tx = db.transaction(['quota'], 'readwrite');
        const store = tx.objectStore('quota');
        
        await store.put({ key: 'date', value: today });
        await store.put({ key: 'used', value: 0 });
        await store.put({ key: 'digest', value: await this.computeDigest(today, 0) });
        
        await tx.done;
        console.log('[LIFECYCLE] quota-reset');
    }
}

export default new QuotaManager();