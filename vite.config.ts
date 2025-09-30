import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        react(),
        {
          name: 'svg-plugin',
          transform(code, id) {
            if (id.endsWith('.svg')) {
              return {
                code: `export default ${JSON.stringify(code)}`,
                map: null,
              };
            }
          },
        },
        {
          name: 'debug-plugin',
          resolveId(id, importer) {
            if (importer) {
              console.log(`Resolving ${id} from ${importer}`);
            }
            return null;
          },
        },
      ],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'components/pieces': path.resolve(__dirname, 'components/pieces'),
        }
      },
    };
});
