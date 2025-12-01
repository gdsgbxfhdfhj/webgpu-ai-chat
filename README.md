# AI Chat - GitHub Pages Ready

100% on-device AI chat powered by WebGPU. Fully CSP-compliant and ready for GitHub Pages deployment.

## Features

- ✅ WebGPU-powered on-device AI
- ✅ Zero backend, zero API keys
- ✅ CSP-compliant (no eval, no dynamic code)
- ✅ Multiple AI personalities
- ✅ Offline support
- ✅ GitHub Pages compatible
- ✅ Telegram Mini App ready

## Quick Deploy to GitHub Pages

1. Fork/clone this repository
2. Push to GitHub
3. Enable GitHub Pages in Settings → Pages
4. Select main branch as source
5. Access at: `https://USERNAME.github.io/REPO_NAME`

## Local Development
```bash
# Serve locally (requires Python)
python3 -m http.server 8080

# Open: http://localhost:8080
```

## Requirements

- Chrome 113+ / Edge 113+ / Safari 18+
- WebGPU-capable device
- ~1GB storage for model cache

## Telegram Mini App Setup

1. Create bot with @BotFather: `/newbot`
2. Create Mini App: `/newapp`
3. Enter URL: `https://USERNAME.github.io/REPO_NAME`
4. Access: `https://t.me/YOUR_BOT/APPNAME`

## Architecture

- **No eval()**: All code is static ES modules
- **No dynamic imports**: Only static imports
- **CSP-safe**: Compatible with strict CSP policies
- **Service Worker**: Offline support with CSP-safe caching
- **WebLLM**: Loads from CDN, no dynamic code generation

## File Structure
```
/
├── index.html          # Entry point
├── manifest.json       # PWA manifest
├── styles.css          # All styles
├── app.js              # Main app
├── sw.js               # Service worker
├── core/               # Core logic
├── ui/                 # UI components
└── utils/              # Utilities
```

## Model Configuration

Default: Qwen2.5-0.5B (~300MB, fast)

Change in `core/modelLoader.js`:
```javascript
const MODEL_CONFIG = {
    default: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    balanced: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    lite: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"
};
```

## License

MIT