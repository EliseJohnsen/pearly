import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopProduct',
  title: 'Butikkprodukt',
  type: 'document',
  fields: [
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Unik produkt-SKU (f.eks. KIT-001)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Produktnavn',
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
      name: 'patternReference',
      title: 'Mønster-referanse',
      type: 'string',
      description: 'UUID til mønsteret i databasen',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Kort beskrivelse',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'longDescription',
      title: 'Detaljert beskrivelse',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Rik tekst med formatering',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'I salg', value: 'in_stock'},
          {title: 'Utsolgt', value: 'out_of_stock'},
          {title: 'Kommer snart', value: 'coming_soon'},
        ],
      },
      initialValue: 'in_stock',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'difficultyLevel',
      title: 'Vanskelighetsgrad',
      type: 'string',
      options: {
        list: [
          {title: 'Lett', value: 'easy'},
          {title: 'Medium', value: 'medium'},
          {title: 'Vanskelig', value: 'hard'},
        ],
      },
    }),
    defineField({
      name: 'images',
      title: 'Bilder',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternativ tekst',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'isPrimary',
              type: 'boolean',
              title: 'Hovedbilde',
              description: 'Er dette hovedbildet for produktet?',
              initialValue: false,
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'categories',
      title: 'Kategorier',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
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
      name: 'variants',
      title: 'Varianter',
      type: 'array',
      of: [{type: 'productVariant'}],
      description: 'Forskjellige versjoner av produktet (f.eks. størrelser, kit-typer)',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'currency',
      title: 'Valuta',
      type: 'string',
      initialValue: 'NOK',
      readOnly: true,
    }),
    defineField({
      name: 'vatRate',
      title: 'MVA-sats (%)',
      type: 'number',
      initialValue: 25,
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta-tittel',
          type: 'string',
          description: 'Vises i søkemotorer (maks 60 tegn)',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta-beskrivelse',
          type: 'text',
          rows: 3,
          description: 'Vises i søkemotorer (maks 160 tegn)',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'keywords',
          title: 'Nøkkelord',
          type: 'array',
          of: [{type: 'string'}],
          options: {
            layout: 'tags',
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      sku: 'sku',
      media: 'images.0',
      status: 'status',
    },
    prepare(selection) {
      const {title, sku, media, status} = selection
      const statusMap: Record<string, string> = {
        in_stock: 'I salg',
        out_of_stock: 'Utsolgt',
        coming_soon: 'Kommer snart',
      }
      return {
        title,
        subtitle: `${sku} - ${statusMap[status] || status}`,
        media,
      }
    },
  },
})
