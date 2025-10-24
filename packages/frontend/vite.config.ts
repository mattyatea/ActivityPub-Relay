import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to move HTML files to correct locations after build
function moveHtmlPlugin(): Plugin {
	return {
		name: 'move-html',
		apply: 'build',
		async closeBundle() {
			const publicDir = path.resolve(__dirname, '../relay/public');

			// Wait a bit for files to be written
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Move pages/index/index.html to index.html
			const indexSrc = path.join(publicDir, 'pages/index/index.html');
			const indexDest = path.join(publicDir, 'index.html');
			if (fs.existsSync(indexSrc)) {
				fs.mkdirSync(path.dirname(indexDest), { recursive: true });
				fs.renameSync(indexSrc, indexDest);
				console.log('✓ Moved index.html to root');
			}

			// Move pages/admin/index.html to admin/index.html
			const adminSrc = path.join(publicDir, 'pages/admin/index.html');
			const adminDest = path.join(publicDir, 'admin/index.html');
			if (fs.existsSync(adminSrc)) {
				fs.mkdirSync(path.dirname(adminDest), { recursive: true });
				fs.renameSync(adminSrc, adminDest);
				console.log('✓ Moved admin/index.html');
			}

			// Remove empty pages directory
			const pagesDir = path.join(publicDir, 'pages');
			if (fs.existsSync(pagesDir)) {
				fs.rmSync(pagesDir, { recursive: true, force: true });
				console.log('✓ Cleaned up pages directory');
			}
		},
	};
}

// Automatically discover all pages with index.html
function getPageEntries() {
	const pagesDir = path.resolve(__dirname, 'src/pages');
	const entries: Record<string, string> = {};

	if (!fs.existsSync(pagesDir)) {
		return entries;
	}

	const pageNames = fs
		.readdirSync(pagesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	for (const pageName of pageNames) {
		const indexPath = path.join(pagesDir, pageName, 'index.html');
		if (fs.existsSync(indexPath)) {
			entries[`pages/${pageName}/index`] = indexPath;
		}
	}

	return entries;
}

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					// Remove whitespace in production
					whitespace: 'condense',
				},
			},
		}),
		moveHtmlPlugin(),
		visualizer({
			filename: 'dist/stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true,
		}),
		{
			name: 'dev-server-index',
			configureServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (req.url === '/') {
						req.url = '/pages/index/index.html';
					} else if (req.url === '/admin' || req.url === '/admin/') {
						req.url = '/pages/admin/index.html';
					}
					next();
				});
			},
		},
	],
	define: {
		// Enable production mode optimizations
		__VUE_OPTIONS_API__: false,
		__VUE_PROD_DEVTOOLS__: false,
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
	},
	root: path.resolve(__dirname, 'src'),
	base: '/',
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	server: {
		port: 5173,
		open: false,
		proxy: {
			'^/api/(?!.*\\.(ts|js|vue)$)': {
				target: 'http://localhost:8787',
				changeOrigin: true,
			},
			'/.well-known': {
				target: 'http://localhost:8787',
				changeOrigin: true,
			},
			'/actor': {
				target: 'http://localhost:8787',
				changeOrigin: true,
			},
			'/inbox': {
				target: 'http://localhost:8787',
				changeOrigin: true,
			},
			'/nodeinfo': {
				target: 'http://localhost:8787',
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: path.resolve(__dirname, '../relay/public'),
		emptyOutDir: true,
		rollupOptions: {
			input: getPageEntries(),
			output: {
				entryFileNames: (chunkInfo) => {
					// Remove 'pages/' prefix from entry file names
					const name = chunkInfo.name.replace('pages/', '').replace(/\//g, '-');
					return `assets/${name}-[hash].js`;
				},
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
				manualChunks: (id) => {
					// Separate Vue
					if (id.includes('node_modules/vue')) {
						return 'vue';
					}
					// Separate ORPC libraries
					if (id.includes('node_modules/@orpc')) {
						return 'orpc';
					}
					// Separate Zod (validation library used by contract)
					if (id.includes('node_modules/zod')) {
						return 'zod';
					}
					// Keep contract separate if it's large
					if (id.includes('packages/contract')) {
						return 'contract';
					}
				},
			},
			treeshake: {
				moduleSideEffects: false,
				propertyReadSideEffects: false,
			},
		},
		minify: 'esbuild',
		target: 'es2020',
		sourcemap: false,
		chunkSizeWarningLimit: 600,
	},
});
