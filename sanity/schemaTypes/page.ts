import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'page',
  title: 'Side',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Sidetittel',
      type: 'string',
      description: 'Internt navn for denne siden',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-vennlig identifikator (f.eks. "hjem", "om-oss", "kontakt")',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seoMetadata',
      title: 'SEO Metadata',
      type: 'object',
      description: 'Søkemotoroptimalisering',
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          title: 'Meta-tittel',
          description: 'Nettleserfane-tittel og SEO-tittel',
          validation: (Rule) => Rule.max(60),
        },
        {
          name: 'metaDescription',
          type: 'text',
          title: 'Meta-beskrivelse',
          description: 'SEO-beskrivelse vist i søkeresultater',
          rows: 3,
          validation: (Rule) => Rule.max(160),
        },
        {
          name: 'ogImage',
          type: 'image',
          title: 'Open Graph bilde',
          description: 'Bilde vist ved deling på sosiale medier (anbefalt: 1200x630px)',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternativ tekst',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'uiStrings',
      title: 'UI-strenger',
      type: 'array',
      description: 'Tekststrenger brukt på denne siden (knapper, labels, meldinger, etc.)',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'key',
              type: 'string',
              title: 'Nøkkel',
              description: 'Unik identifikator (f.eks. "cta.button", "form.submit")',
              validation: (Rule) =>
                Rule.required().custom((key: string | undefined) => {
                  if (!/^[a-z0-9_.]+$/.test(key || '')) {
                    return 'Nøkkel må bare inneholde små bokstaver, tall, punktum og understreker'
                  }
                  return true
                }),
            },
            {
              name: 'value',
              type: 'string',
              title: 'Verdi',
              description: 'Den faktiske teksten som skal vises',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'category',
              type: 'string',
              title: 'Kategori',
              description: 'Grupper relaterte strenger sammen',
              options: {
                list: [
                  {title: 'Knapper', value: 'buttons'},
                  {title: 'Skjemaer', value: 'forms'},
                  {title: 'Labels', value: 'labels'},
                  {title: 'Meldinger', value: 'messages'},
                  {title: 'Navigasjon', value: 'navigation'},
                  {title: 'Validering', value: 'validation'},
                  {title: 'Generelt', value: 'general'},
                ],
              },
            },
            {
              name: 'context',
              type: 'text',
              title: 'Kontekst',
              description: 'Hjelp oversettere forstå hvor og hvordan denne strengen brukes',
              rows: 2,
            },
          ],
          preview: {
            select: {
              key: 'key',
              value: 'value',
              category: 'category',
            },
            prepare({key, value, category}) {
              return {
                title: key || 'Uten tittel',
                subtitle: `[${category || 'general'}] ${value}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'sections',
      title: 'Sideseksjoner',
      type: 'array',
      description: 'Komponenter og seksjoner som utgjør denne siden',
      of: [
        {type: 'hero'},
        {type: 'banner'},
        {type: 'howItWorks'},
        {type: 'content'},
        {type: 'imageCarousel'},
        {type: 'collapsableCards'},
        {
          type: 'object',
          name: 'productsSection',
          title: 'Produktseksjon',
          fields: [
            {
              name: 'sectionTitle',
              type: 'string',
              title: 'Seksjonstittel',
              description: 'Overskrift for produktseksjonen',
            },
            {
              name: 'sectionSubtitle',
              type: 'text',
              title: 'Seksjonsundertittel',
              rows: 2,
            },
            {
              name: 'products',
              type: 'array',
              title: 'Produkter',
              description: 'Velg produkter som skal vises i denne seksjonen',
              of: [{type: 'reference', to: [{type: 'products'}]}],
            },
            {
              name: 'showFeaturedOnly',
              type: 'boolean',
              title: 'Vis kun fremhevede',
              description: 'Vis bare fremhevede produkter',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              title: 'sectionTitle',
              products: 'products',
            },
            prepare({title, products}) {
              return {
                title: title || 'Produktseksjon',
                subtitle: products ? `${products.length} produkter` : 'Ingen produkter',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'showInFooter',
      title: 'Vis i footer',
      type: 'boolean',
      description: 'Skal denne siden vises i footer-navigasjonen?',
      initialValue: false,
    }),
    defineField({
      name: 'footerOrder',
      title: 'Footer rekkefølge',
      type: 'number',
      description: 'Rekkefølgen denne siden vises i footer (lavere tall først)',
      hidden: ({parent}) => !parent?.showInFooter,
      validation: (Rule) =>
        Rule.custom((footerOrder, context) => {
          const parent = context.parent as {showInFooter?: boolean}
          if (parent?.showInFooter && !footerOrder && footerOrder !== 0) {
            return 'Du må sette en rekkefølge for sider som vises i footer'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      sections: 'sections',
    },
    prepare({title, slug, sections}) {
      return {
        title: title,
        subtitle: `/${slug} - ${sections?.length || 0} seksjoner`,
      }
    },
  },
})
