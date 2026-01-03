import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Kategori',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Navn',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Overordnet kategori',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'Valgfri: Lag et hierarki av kategorier',
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      parent: 'parent.name',
    },
    prepare(selection) {
      const {title, parent} = selection
      return {
        title,
        subtitle: parent ? `Under: ${parent}` : 'Hovedkategori',
      }
    },
  },
})
