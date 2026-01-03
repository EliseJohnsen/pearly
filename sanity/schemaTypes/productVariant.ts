import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productVariant',
  title: 'Produktvariant',
  type: 'object',
  fields: [
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Unik variant-SKU (f.eks. KIT-001-LARGE)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Variantnavn',
      type: 'string',
      description: 'F.eks. "Stort perlekit"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Pris',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Sammenlign med pris',
      type: 'number',
      description: 'Originalpris (vises ved nedsettelse)',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'weight',
      title: 'Vekt (gram)',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensjoner',
      type: 'object',
      fields: [
        defineField({
          name: 'width',
          title: 'Bredde (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        }),
        defineField({
          name: 'height',
          title: 'Høyde (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        }),
        defineField({
          name: 'depth',
          title: 'Dybde (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        }),
      ],
    }),
    defineField({
      name: 'shippingClass',
      title: 'Fraktklasse',
      type: 'string',
      options: {
        list: [
          {title: 'Brev', value: 'letter'},
          {title: 'Pakke', value: 'package'},
        ],
      },
      initialValue: 'package',
    }),
    defineField({
      name: 'stockQuantity',
      title: 'Lagerantall',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Er denne varianten tilgjengelig for salg?',
      initialValue: true,
    }),
    defineField({
      name: 'options',
      title: 'Alternativer',
      type: 'array',
      of: [{type: 'productVariantOption'}],
      description: 'F.eks. størrelse, fargeintensitet',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      price: 'price',
      sku: 'sku',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {name, price, sku, isActive} = selection
      return {
        title: name,
        subtitle: `${price} NOK - ${sku}${!isActive ? ' (Inaktiv)' : ''}`,
      }
    },
  },
})
