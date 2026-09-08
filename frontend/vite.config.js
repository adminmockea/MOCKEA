import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  optimizeDeps: {
    include: ['swiper', 'swiper/react', 'swiper/modules'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Normalize separators for cross-platform compatibility
            const normalizedId = id.replace(/\\/g, '/');
            if (
              normalizedId.includes('node_modules/react/') ||
              normalizedId.includes('node_modules/react-dom/') ||
              normalizedId.includes('node_modules/react-router/')
            ) {
              return 'vendor-react';
            }
            if (normalizedId.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-query';
            }
            if (normalizedId.includes('node_modules/firebase/')) {
              return 'vendor-firebase';
            }
            if (normalizedId.includes('node_modules/framer-motion/')) {
              return 'vendor-motion';
            }
            if (normalizedId.includes('node_modules/gsap/')) {
              return 'vendor-gsap';
            }
            if (normalizedId.includes('node_modules/swiper/')) {
              return 'vendor-swiper';
            }
            if (
              normalizedId.includes('node_modules/@headlessui/react/') ||
              normalizedId.includes('node_modules/@heroicons/react/')
            ) {
              return 'vendor-ui';
            }
            if (normalizedId.includes('node_modules/react-icons/pi/')) {
              return 'vendor-icons-pi';
            }
            if (normalizedId.includes('node_modules/react-icons/')) {
              return 'vendor-icons-misc';
            }
            if (
              normalizedId.includes('node_modules/axios/') ||
              normalizedId.includes('node_modules/react-toastify/')
            ) {
              return 'vendor-core-utils';
            }
          }
        }
      }
    }
  }
})
