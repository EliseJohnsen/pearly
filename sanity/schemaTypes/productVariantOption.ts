import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productVariantOption',
  title: 'Variantalternativ',
  type: 'object',
  fields: [
    defineField({
      name: 'optionType',
      title: 'Type',
      type: 'string',
      description: 'F.eks. "Størrelse", "Fargeintensitet"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'optionValue',
      title: 'Verdi',
      type: 'string',
      description: 'F.eks. "Stor", "Livlig"',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      type: 'optionType',
      value: 'optionValue',
    },
    prepare(selection) {
      const {type, value} = selection
      return {
        title: `${type}: ${value}`,
      }
    },
  },
})
