import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'uiStrings',
  title: 'UI Strings',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      description: 'Unique identifier for this string (e.g., "upload.selectImage")',
      validation: (Rule) =>
        Rule.required().custom((key) => {
          // Validate key format: lowercase, dots and underscores only
          if (!/^[a-z0-9_.]+$/.test(key || '')) {
            return 'Key must contain only lowercase letters, numbers, dots, and underscores'
          }
          return true
        }),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The actual text to display',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Group related strings together',
      options: {
        list: [
          {title: 'Forms', value: 'forms'},
          {title: 'Buttons', value: 'buttons'},
          {title: 'Messages', value: 'messages'},
          {title: 'Navigation', value: 'navigation'},
          {title: 'Validation', value: 'validation'},
          {title: 'Labels', value: 'labels'},
          {title: 'General', value: 'general'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Help editors understand where and how this string is used',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'key',
      subtitle: 'value',
      category: 'category',
    },
    prepare({title, subtitle, category}) {
      return {
        title: title || 'Untitled',
        subtitle: `[${category}] ${subtitle}`,
      }
    },
  },
})
