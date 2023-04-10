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
                twitchoverlay: root + '/stream-ass/overlay/overlay.html',
                404: root + '/404/404.html',
                linktree: root + '/linktree/linktree.html',
                popupChat: root + "/stream-ass/popup-chat/popup-chat.html"
            },
            external: [
                /^node:.*/,
            ]
        }
    }
});