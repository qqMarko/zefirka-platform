import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true, // Залишаємо HTTPS для мікрофона
    proxy: {
      // 1. Прокидаємо API запити
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // 2. Прокидаємо WebSockets (щоб чат не відвалювався)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true, // ВАЖЛИВО!
        changeOrigin: true,
        secure: false,
      },
      // 3. Прокидаємо фото, відео та голосові
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})