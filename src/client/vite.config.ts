import { join, resolve } from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import Inspect from '../index'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '~/': __dirname,
    },
  },
  plugins: [
    Vue({
      reactivityTransform: true,
    }),
    Pages({
      dirs: 'pages',
    }),
    UnoCSS(),
    Inspect(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
      ],
      dts: join(__dirname, 'auto-imports.d.ts'),
      dirs: ['composables'],
      vueTemplate: true,
    }),
    Components({
      dts: join(__dirname, 'components.d.ts'),
      dirs: ['components'],
    }),
  ],
  build: {
    target: 'esnext',
    outDir: resolve(__dirname, '../../dist/client'),
    minify: false, // 'esbuild',
    emptyOutDir: true,
  },
})
