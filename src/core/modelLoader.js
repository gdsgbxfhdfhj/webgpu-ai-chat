import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { openDB } from '../utils/storage.js';

// Model configuration - easily switch models here
const MODEL_CONFIG = {
    default: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", // ~300MB, fast, recommended
    balanced: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", // ~900MB, better quality
    lite: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"   // ~600MB, fallback for low memory
};

class ModelLoader {
    constructor() {
        this.engine = null;
        this.isLoaded = false;
        this.currentModel = null;
        this.memoryThreshold = 2 * 1024 * 1024 * 1024; // 2GB
    }

    async checkWebGPUSupport() {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported. Please use Chrome 113+, Edge 113+, or Safari 18+.');
        }
        
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('No WebGPU adapter found.');
            }
            return true;
        } catch (error) {
            throw new Error(`WebGPU initialization failed: ${error.message}`);
        }
    }

    async checkMemoryAvailability() {
        if (window.TEST_LOW_MEMORY) {
            console.log('[MEMORY] Test mode: forcing low memory');
            return false;
        }

        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            console.log('[MEMORY] Low device memory detected:', navigator.deviceMemory, 'GB');
            return false;
        }

        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            const available = limit - used;
            
            console.log('[MEMORY] Heap:', {
                used: Math.round(used / 1024 / 1024) + 'MB',
                limit: Math.round(limit / 1024 / 1024) + 'MB',
                available: Math.round(available / 1024 / 1024) + 'MB'
            });
            
            if (available < this.memoryThreshold) {
                return false;
            }
        }

        return true;
    }

    async selectModel(preferredModel) {
        const hasMemory = await this.checkMemoryAvailability();
        
        if (!hasMemory) {
            console.warn('[MODEL] Low memory detected, using lite model');
            return MODEL_CONFIG.lite;
        }
        
        return preferredModel || MODEL_CONFIG.default;
    }

    async loadModel(modelName, onProgress) {
        console.log('[LIFECYCLE] model-download-start', { model: modelName });
        
        await this.checkWebGPUSupport();
        
        const selectedModel = await this.selectModel(modelName);
        console.log('[MODEL] Selected model:', selectedModel);

        try {
            this.engine = await webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (report) => {
                    const progress = Math.round(report.progress * 100);
                    
                    if (report.text.includes('download') || report.text.includes('fetch')) {
                        console.log('[LIFECYCLE] model-download-progress', { progress, text: report.text });
                    }
                    
                    if (report.text.includes('compil')) {
                        if (progress === 0 || !this.compileStartLogged) {
                            console.log('[LIFECYCLE] model-compile-start');
                            this.compileStartLogged = true;
                        }
                    }
                    
                    onProgress({
                        progress,
                        text: report.text,
                        stage: this.getStage(report.text)
                    });
                },
            });

            this.isLoaded = true;
            this.currentModel = selectedModel;
            
            console.log('[LIFECYCLE] model-download-complete', { model: selectedModel });
            console.log('[LIFECYCLE] model-compile-complete');
            
            return this.engine;
        } catch (error) {
            console.error('[MODEL] Loading error:', error);
            
            if (selectedModel !== MODEL_CONFIG.lite && error.message.includes('memory')) {
                console.warn('[MODEL] Retrying with lite model due to memory error');
                return this.loadModel(MODEL_CONFIG.lite, onProgress);
            }
            
            throw new Error(`Failed to load model: ${error.message}`);
        }
    }

    getStage(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('fetch') || lowerText.includes('download') || lowerText.includes('loading')) {
            return 'loading';
        }
        if (lowerText.includes('compil')) return 'compiling';
        if (lowerText.includes('initializ')) return 'initializing';
        return 'processing';
    }

    async generateStream(messages, onToken, onComplete, signal) {
        if (!this.isLoaded || !this.engine) {
            throw new Error('Model not loaded');
        }

        console.log('[LIFECYCLE] generation-start');

        try {
            let fullResponse = '';
            
            const completion = await this.engine.chat.completions.create({
                messages,
                temperature: 0.7,
                max_tokens: 800,
                stream: true,
            });

            for await (const chunk of completion) {
                if (signal?.aborted) {
                    console.log('[LIFECYCLE] generation-cancel');
                    await this.engine.interruptGenerate();
                    break;
                }

                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    onToken(content);
                }
            }

            onComplete(fullResponse);
            return fullResponse;
        } catch (error) {
            if (signal?.aborted) {
                console.log('[LIFECYCLE] generation-cancel');
                return '';
            }
            throw error;
        }
    }

    async resetChat() {
        if (this.engine) {
            try {
                await this.engine.resetChat();
            } catch (error) {
                console.error('[MODEL] Reset error:', error);
            }
        }
    }

    isReady() {
        return this.isLoaded && this.engine !== null;
    }

    getCurrentModel() {
        return this.currentModel;
    }

    getModelConfig() {
        return MODEL_CONFIG;
    }
}

export default new ModelLoader();