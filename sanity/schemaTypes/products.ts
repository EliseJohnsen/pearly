import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'products',
  title: 'Produkter',
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
      name: 'patternId',
      title: 'Mønster-ID',
      type: 'string',
      description: 'ID til mønsteret i databasen (kun for produkter med mønster)',
      hidden: ({document}) => document?.productType !== 'kit',
    }),
    defineField({
      name: 'title',
      title: 'Produktnavn',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'productType',
      title: 'Produkttype',
      type: 'string',
      options: {
        list: [
          {title: 'Perlekit', value: 'kit'},
          {title: 'Verktøy', value: 'tools'},
          {title: 'Eget motiv', value: 'custom_kit'},
          {title: 'Strukturprodukt', value: 'structure'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'kit',
    }),
    {
      name: 'productSize',
      title: 'Produktstørrelse',
      type: 'number',
      hidden: ({document}) => document?.productType !== 'custom_kit',
      validation: (Rule) => Rule.integer().min(1).max(3)
    },
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
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'reference',
      to: [{type: 'category'}],
      hidden: ({document}) => document?.productType !== 'kit',
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
      name: 'price',
      title: 'Pris',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'originalPrice',
      title: 'Originalpris',
      type: 'number',
      description: 'Vises ved rabatt',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'vatRate',
      title: 'MVA-sats (%)',
      type: 'number',
      initialValue: 25,
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'currency',
      title: 'Valuta',
      type: 'string',
      initialValue: 'NOK',
      readOnly: true,
    }),
    defineField({
      name: 'requiresParent',
      title: 'Krever tilknyttet produkt',
      type: 'boolean',
      description: 'Kan dette produktet kun kjøpes sammen med et annet produkt?',
      initialValue: false,
      hidden: ({document}) => document?.productType !== 'structure',
    }),
    defineField({
      name: 'allowedParents',
      title: 'Tillatte foreldreprodukter',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Perlekit', value: 'kit'},
          {title: 'Eget motiv', value: 'custom_kit'},
          {title: 'Verktøy', value: 'tools'},
        ],
      },
      description: 'Hvilke produkttyper kan dette strukturproduktet knyttes til?',
      hidden: ({document}) => document?.productType !== 'structure' || !document?.requiresParent,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const requiresParent = (context.document as any)?.requiresParent
          if (requiresParent && (!value || value.length === 0)) {
            return 'Du må velge minst én tillatt produkttype'
          }
          return true
        }),
    }),
    defineField({
      name: 'requiredBoards',
      title: 'Antall perlebrett påkrevd',
      type: 'number',
      description: 'Hvor mange perlebrett trengs for dette kittet? (brukes for anbefaling)',
      hidden: ({document}) =>
        document?.productType !== 'kit' && document?.productType !== 'custom_kit',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const productType = (context.document as any)?.productType
          if ((productType === 'kit' || productType === 'custom_kit') && value && value <= 0) {
            return 'Antall perlebrett må være større enn 0'
          }
          return true
        }),
    }),
    defineField({
      name: 'recommendedAddOns',
      title: 'Relaterte produkter',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'products'}],
        },
      ],
      description: 'Produkter som anbefales sammen med dette produktet',
    }),
    defineField({
      name: 'gridSize',
      title: 'Dimensjon',
      type: 'string',
      description: 'F.eks. "29x29" eller "1x1 brett"',
      hidden: ({document}) => document?.productType !== 'kit',
    }),
    defineField({
      name: 'width',
      title: 'Bredde (cm)',
      type: 'number',
      description: 'Beregnet bredde basert på antall perler',
      hidden: ({document}) => document?.productType !== 'kit',
    }),
    defineField({
      name: 'height',
      title: 'Høyde (cm)',
      type: 'number',
      description: 'Beregnet høyde basert på antall perler',
      hidden: ({document}) => document?.productType !== 'kit',
    }),
    defineField({
      name: 'weight',
      title: 'Vekt (gram)',
      type: 'number',
      description: 'Beregnet vekt basert på antall perler',
      hidden: ({document}) => document?.productType !== 'kit',
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
      hidden: ({document}) => document?.productType !== 'kit',
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
      name: 'colors',
      title: 'Antall farger',
      type: 'number'
    }),
    defineField({
      name: 'patternBeadWdth',
      title: 'Antall perler i bredden',
      type: 'number'
    }),
    defineField({
      name: 'patternBeadHeight',
      title: 'Antall perler i høyden',
      type: 'number'
    }),
    defineField({
      name: 'totalBeads',
      title: 'Totalt antall perler',
      type: 'number'
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
        kit: 'Perlekit',
        tools: 'Verktøy',
        custom_kit: 'Eget motiv',
        structure: 'Strukturprodukt',
      }
      return {
        title,
        subtitle: `${typeMap[productType] || productType} - ${sku} - ${statusMap[status] || status}`,
        media,
      }
    },
  },
})
