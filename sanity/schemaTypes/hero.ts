import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'document',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Main heading text for the hero section',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      description: 'Optional subheading or description text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Hero Image',
      type: 'image',
      description: 'Background or featured image for the hero section',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for accessibility and SEO',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'ctaButton',
      title: 'Call to Action Button',
      type: 'object',
      description: 'Optional button in the hero section',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Button Text',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'href',
          type: 'string',
          title: 'Button Link',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Toggle to show or hide this hero section',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'subheading',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({title, subtitle, media, isActive}) {
      return {
        title: isActive ? title : `[INACTIVE] ${title}`,
        subtitle: subtitle || 'No subheading',
        media,
      }
    },
  },
})
