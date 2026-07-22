import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 3000, // Port 3000 bypasses Windows Hyper-V excluded port reservation range
    strictPort: false,
  },
});
