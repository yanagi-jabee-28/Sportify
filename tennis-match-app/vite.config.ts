import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	root: '.',
	base: './',
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html')
			}
		},
		target: 'es2020',
		minify: 'terser',
		sourcemap: true
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
			'@/types': resolve(__dirname, 'src/types'),
			'@/components': resolve(__dirname, 'src/components'),
			'@/core': resolve(__dirname, 'src/core'),
			'@/utils': resolve(__dirname, 'src/utils')
		}
	},
	server: {
		port: 3000,
		open: true,
		host: true
	},
	preview: {
		port: 4173,
		host: true
	}
});
