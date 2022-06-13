import { plugins, onwarn } from './c.js'

export default [
  {
    input: 'src/server/api.ts',
    output: {
      file: 'dist/bundle/server/api.js',
      name: 'Api',
      format: 'cjs'
    },
    plugins: plugins(),
    onwarn,
  }, {
    input: 'src/server/streaming.ts',
    output: {
      file: 'dist/bundle/server/streaming.js',
      name: 'Streaming',
      format: 'cjs'
    },
    plugins: plugins(),
    onwarn,
  }
]