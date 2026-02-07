/**
 * Hot Metal CMS Application
 *
 * Entry point for the SonicJS headless CMS
 */

import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core'
import type { SonicJSConfig } from '@sonicjs-cms/core'

import postsCollection from './collections/posts.collection'
import renditionsCollection from './collections/renditions.collection'

registerCollections([
  postsCollection,
  renditionsCollection,
])

const config: SonicJSConfig = {
  collections: {
    autoSync: true,
  },
  plugins: {
    directory: './src/plugins',
    autoLoad: false,
  },
}

export default createSonicJSApp(config)
