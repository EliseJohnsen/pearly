import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'banner',
  title: 'Banner',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Banner Text',
      type: 'string',
      description: 'Main text displayed in the banner',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Custom Background Color',
      type: 'string',
      description: 'Optional custom background color (e.g., #FBE7F5). Leave empty to use default.',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Toggle to show or hide this banner',
      initialValue: true,
    }),
    defineField({
      name: 'link',
      title: 'Optional Link',
      type: 'object',
      description: 'Make the banner clickable',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Link Text',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'href',
          type: 'string',
          title: 'URL',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'text',
      type: 'type',
      isActive: 'isActive',
    },
    prepare({title, type, isActive}) {
      return {
        title: isActive ? title : `[INACTIVE] ${title}`,
        subtitle: `Type: ${type}`,
      }
    },
  },
})
