import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'products',
  title: 'Produkter',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Animals', value: 'animals'},
          {title: 'Nature', value: 'nature'},
          {title: 'Abstract', value: 'abstract'},
          {title: 'Characters', value: 'characters'},
          {title: 'Holiday', value: 'holiday'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          {title: 'Easy', value: 'easy'},
          {title: 'Medium', value: 'medium'},
          {title: 'Hard', value: 'hard'},
        ],
      },
    }),
    defineField({
      name: 'colors',
      title: 'Number of Colors',
      type: 'number',
      description: 'Number of different bead colors used',
    }),
    defineField({
      name: 'gridSize',
      title: 'Grid Size',
      type: 'string',
      description: 'E.g., "29x29" or "Square pegboard"',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this inspiration on the homepage',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      category: 'category',
      difficulty: 'difficulty',
    },
    prepare(selection) {
      const {title, media, category, difficulty} = selection
      return {
        title,
        subtitle: `${category || 'Uncategorized'} - ${difficulty || 'No difficulty'}`,
        media,
      }
    },
  },
})
