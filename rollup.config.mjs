// rollup.config.js
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/plotkrig.ts',
  output: {
    dir: '.',
    format: 'iife',
    globals: {
        'mathjs': 'math',
        'peerjs': 'Peer'
    }
  },
  plugins: [typescript()],
  external: ['mathjs', 'peerjs']
};
