import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'navigation',
  title: 'Navigation Item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The text displayed in the navigation menu',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link URL',
      type: 'string',
      description: 'The URL or path this navigation item links to',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Determines the display order (lower numbers appear first)',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'type',
      title: 'Navigation Type',
      type: 'string',
      description: 'Where this navigation item should appear',
      options: {
        list: [
          {title: 'Main Menu', value: 'main'},
          {title: 'Call to Action', value: 'cta'},
          {title: 'Footer', value: 'footer'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Style Variant',
      type: 'string',
      description: 'Visual style of the navigation item',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
      order: 'order',
    },
    prepare({title, subtitle, order}) {
      return {
        title: `${order}. ${title}`,
        subtitle: subtitle ? `Type: ${subtitle}` : 'No type set',
      }
    },
  },
})
