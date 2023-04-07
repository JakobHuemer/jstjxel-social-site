import { defineConfig } from 'vite';

const root = 'src';
export default defineConfig({
    root,
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: root + '/index.html',
                logs: root + '/dev/logs.html',
                twitchoverlay: root + '/twitchacc/overlay.html',
            },
            external: [
                /^node:.*/,
            ]
        }
    }
});