import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

// Choose build format based on environment variable
const env = process.env.FORMAT || 'all';

// Output configurations
const configs = [];

// ESM build
if (env === 'all' || env === 'esm') {
  configs.push({
    input: 'client.ts',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            target: 'es2020',
            module: 'es2020'
          }
        },
        useTsconfigDeclarationDir: true
      })
    ],
    external: Object.keys(pkg.dependencies || {})
  });
}

// Browser UMD build
if (env === 'all' || env === 'umd') {
  configs.push({
    input: 'client.ts',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'A2AClient',
      sourcemap: true,
      globals: {
        uuid: 'uuid',
        axios: 'axios',
        'eventsource-parser': 'eventSourceParser'
      }
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            target: 'es2020'
          }
        }
      }),
      terser()
    ],
    external: ['uuid', 'axios', 'eventsource-parser']
  });
}

export default configs; 