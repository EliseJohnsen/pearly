import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productCarousel',
  title: 'Produktkarusell',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      description: 'Overskrift for produktkarusellen',
    }),
    defineField({
      name: 'products',
      title: 'Produkter',
      type: 'array',
      description: 'Velg opptil 5 produkter som skal vises i karusellen',
      of: [{type: 'reference', to: [{type: 'products'}]}],
      validation: (Rule) => Rule.max(5),
    }),
    defineField({
      name: 'viewMoreLink',
      title: 'Vis mer-lenke',
      type: 'object',
      description: 'Kortet som vises på slutten av karusellen',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Tekst',
          description: 'Tekst på "Vis mer"-kortet',
          initialValue: 'Vis mer',
        },
        {
          name: 'href',
          type: 'string',
          title: 'Lenke (URL)',
          description: 'URL-en "Vis mer" skal lenke til (f.eks. /perlepakker)',
        },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Skal denne seksjonen vises på siden?',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      products: 'products',
    },
    prepare({title, products}: {title?: string; products?: unknown[]}) {
      return {
        title: title || 'Produktkarusell',
        subtitle: products ? `${products.length} produkter` : 'Ingen produkter',
      }
    },
  },
})
