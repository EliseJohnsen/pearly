import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'navigation',
  title: 'Toppmeny',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Teksten som vises i navigasjonsmenyen',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'page',
      title: 'Side',
      type: 'reference',
      to: [{type: 'page'}],
      description: 'Velg en side fra systemet',
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
      type: 'type',
      order: 'order',
      pageSlug: 'page.slug.current',
    },
    prepare({title, type, order, pageSlug}) {
      return {
        title: `${order}. ${title}`,
        subtitle: pageSlug
          ? `${type} → /${pageSlug}`
          : type
            ? `Type: ${type}`
            : 'Ingen side valgt',
      }
    },
  },
})
