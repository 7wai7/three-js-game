import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
    plugins: [wasm()],
    optimizeDeps: {
        include: ['@dimforge/rapier3d']
    }
});