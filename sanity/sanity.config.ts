import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {documentInternationalization} from '@sanity/document-internationalization'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Perle Admin',

  projectId: 'qpdup7gv',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    documentInternationalization({
      supportedLanguages: [
        {id: 'nb', title: 'Norsk Bokmål'},
        {id: 'en', title: 'English'},
      ],
      schemaTypes: [
        'navigation',
        'hero',
        'banner',
        'howItWorks',
        'uiStrings',
        'pageSettings',
        'emailTemplate',
        'inspiration',
      ],
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
