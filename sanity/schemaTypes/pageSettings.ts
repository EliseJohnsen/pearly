import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'pageSettings',
  title: 'Page Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
      description: 'Which page these settings apply to',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'About', value: 'about'},
          {title: 'Contact', value: 'contact'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Browser tab title and SEO title',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      description: 'SEO description shown in search results',
      rows: 3,
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image shown when sharing on social media (recommended: 1200x630px)',
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
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Browser tab icon (recommended: square image, at least 512x512px)',
      options: {
        accept: 'image/png,image/x-icon,image/svg+xml',
      },
    }),
  ],
  preview: {
    select: {
      title: 'page',
      subtitle: 'title',
    },
    prepare({title, subtitle}) {
      return {
        title: `${title?.charAt(0).toUpperCase()}${title?.slice(1)} Page`,
        subtitle: subtitle || 'No title set',
      }
    },
  },
})
