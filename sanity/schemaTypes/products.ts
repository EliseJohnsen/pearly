import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'products',
  title: 'Produkter',
  type: 'document',
  fields: [
    defineField({
      name: 'productType',
      title: 'Produkttype',
      type: 'string',
      options: {
        list: [
          {title: 'Perleplatemønster', value: 'pattern'},
          {title: 'Perlekit', value: 'kit'},
          {title: 'Perler', value: 'beads'},
          {title: 'Verktøy', value: 'tools'},
          {title: 'Perleplater', value: 'pegboards'},
          {title: 'Annet', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'pattern',
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Unik produkt-SKU (f.eks. KIT-001)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Produktnavn',
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
      name: 'patternId',
      title: 'Mønster-ID',
      type: 'string',
      description: 'ID til mønsteret i databasen (kun for produkter med mønster)',
      hidden: ({document}) => document?.productType !== 'pattern' && document?.productType !== 'kit',
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      options: {
        list: [
          {title: 'Dyr', value: 'animals'},
          {title: 'Natur', value: 'nature'},
          {title: 'Abstrakt', value: 'abstract'},
          {title: 'Karakterer', value: 'characters'},
          {title: 'Høytid', value: 'holiday'},
          {title: 'Annet', value: 'other'},
        ],
      },
      hidden: ({document}) => document?.productType !== 'pattern',
    }),
    defineField({
      name: 'difficulty',
      title: 'Vanskelighetsgrad',
      type: 'string',
      options: {
        list: [
          {title: 'Lett', value: 'easy'},
          {title: 'Medium', value: 'medium'},
          {title: 'Vanskelig', value: 'hard'},
        ],
      },
      hidden: ({document}) => document?.productType !== 'pattern' && document?.productType !== 'kit',
    }),
    defineField({
      name: 'colors',
      title: 'Antall farger',
      type: 'number',
      description: 'Antall forskjellige perlefarger brukt',
      hidden: ({document}) => document?.productType !== 'pattern' && document?.productType !== 'kit',
    }),
    defineField({
      name: 'gridSize',
      title: 'Brettstørrelse',
      type: 'string',
      description: 'F.eks. "29x29" eller "1x1 brett"',
      hidden: ({document}) => document?.productType !== 'pattern' && document?.productType !== 'kit',
    }),
    defineField({
      name: 'variants',
      title: 'Varianter',
      type: 'array',
      of: [{type: 'productVariant'}],
      description: 'Forskjellige versjoner av produktet (f.eks. størrelser, kit-typer)',
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
      description: 'Vis dette produktet på forsiden',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Visningsrekkefølge',
      type: 'number',
      description: 'Lavere tall vises først',
      initialValue: 0,
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
      title: 'title',
      media: 'images.0',
      sku: 'sku',
      status: 'status',
      productType: 'productType',
    },
    prepare(selection) {
      const {title, media, sku, status, productType} = selection
      const statusMap: Record<string, string> = {
        in_stock: 'I salg',
        out_of_stock: 'Utsolgt',
        coming_soon: 'Kommer snart',
      }
      const typeMap: Record<string, string> = {
        pattern: 'Mønster',
        kit: 'Kit',
        beads: 'Perler',
        tools: 'Verktøy',
        pegboards: 'Perleplater',
        other: 'Annet',
      }
      return {
        title,
        subtitle: `${typeMap[productType] || productType} - ${sku} - ${statusMap[status] || status}`,
        media,
      }
    },
  },
})
