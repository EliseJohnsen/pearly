import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'

const projectId = 'qpdup7gv'

export default defineConfig([
  {
    name: 'production-workspace',
    title: 'Perle Admin (Production)',
    basePath: '/production',

    projectId,
    dataset: 'production',

    plugins: [
      structureTool(),
      visionTool(),
      presentationTool({
        previewUrl: {
          origin:
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? 'http://localhost:3000'
              : 'https://pearly-bice.vercel.app',
          previewMode: {
            enable: '/api/draft',
          },
        },
        resolve: {
          locations: {
            page: {
              select: {
                title: 'title',
                slug: 'slug.current',
              },
              resolve: (doc) => ({
                locations: [
                  {
                    title: doc?.title || 'Side',
                    href: `/${doc?.slug}`,
                  },
                ],
              }),
            },
          },
        },
      }),
    ],

    schema: {
      types: schemaTypes,
    },
  },
  {
    name: 'test-workspace',
    title: 'Perle Admin (Test)',
    basePath: '/test',

    projectId,
    dataset: 'test',

    plugins: [
      structureTool(),
      visionTool(),
      presentationTool({
        previewUrl: {
          origin:
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? 'http://localhost:3000'
              : 'https://pearly-bice.vercel.app',
          previewMode: {
            enable: '/api/draft',
          },
        },
        resolve: {
          locations: {
            page: {
              select: {
                title: 'title',
                slug: 'slug.current',
              },
              resolve: (doc) => ({
                locations: [
                  {
                    title: doc?.title || 'Side',
                    href: `/${doc?.slug}`,
                  },
                ],
              }),
            },
          },
        },
      }),
    ],

    schema: {
      types: schemaTypes,
    },
  },
])
