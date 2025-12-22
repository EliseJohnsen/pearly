import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'howItWorks',
  title: 'How It Works Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Main heading for the "How It Works" section',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      description: 'Optional subtitle or description for the section',
      rows: 3,
    }),
    defineField({
      name: 'fontColor',
      title: 'Custom Font Color',
      type: 'string',
      description: 'Optional custom font color for icons and text (e.g., #BA7EB9). Leave empty to use default.',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Custom Background Color',
      type: 'string',
      description: 'Optional custom background color for icon containers (e.g., #F5B0DF). Leave empty to use default.',
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      description: 'Individual steps explaining how the app works',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Step Title',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              type: 'text',
              title: 'Step Description',
              rows: 3,
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'icon',
              type: 'string',
              title: 'Icon Name',
              description: 'Optional Heroicon name (e.g., "CloudArrowUpIcon")',
            },
            {
              name: 'image',
              type: 'image',
              title: 'Step Image',
              description: 'Optional image instead of icon',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative Text',
                },
              ],
            },
            {
              name: 'order',
              type: 'number',
              title: 'Order',
              description: 'Display order (lower numbers appear first)',
              validation: (Rule) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              title: 'title',
              order: 'order',
              media: 'image',
            },
            prepare({title, order, media}) {
              return {
                title: `${order}. ${title}`,
                media,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'sectionTitle',
      steps: 'steps',
    },
    prepare({title, steps}) {
      return {
        title: title || 'How It Works',
        subtitle: steps ? `${steps.length} steps` : 'No steps',
      }
    },
  },
})
