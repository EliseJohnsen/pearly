import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Internt navn for denne footer-konfigurasjonen',
      initialValue: 'Footer',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'companyInfo',
      title: 'Bedriftsinformasjon',
      type: 'object',
      description: 'Informasjon om bedriften som vises i footer',
      fields: [
        {
          name: 'companyName',
          type: 'string',
          title: 'Bedriftsnavn',
        },
        {
          name: 'email',
          type: 'string',
          title: 'E-post',
        },
        {
          name: 'description',
          type: 'text',
          title: 'Beskrivelse',
          rows: 3,
          description: 'Kort beskrivelse av bedriften',
        },
        {
          name: 'logo',
          type: 'image',
          title: 'Logo',
          description: 'Bedriftslogo for footer',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
    defineField({
      name: 'navigationColumns',
      title: 'Navigasjonskolonner',
      type: 'array',
      description: 'Kolonner med lenker i footer',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'columnTitle',
              type: 'string',
              title: 'Kolonnetittel',
              description: 'Overskrift for denne kolonnen (f.eks. "Om oss", "Produkter")',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'links',
              type: 'array',
              title: 'Lenker',
              description: 'Lenker i denne kolonnen',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'linkText',
                      type: 'string',
                      title: 'Lenketekst',
                      description: 'Teksten som vises for lenken',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'page',
                      type: 'reference',
                      title: 'Side',
                      to: [{type: 'page'}],
                      description: 'Velg en side å lenke til',
                      validation: (Rule) => Rule.required(),
                    },
                  ],
                  preview: {
                    select: {
                      title: 'linkText',
                      pageTitle: 'page.title',
                      pageSlug: 'page.slug.current',
                    },
                    prepare({title, pageTitle, pageSlug}) {
                      return {
                        title: title || 'Ingen tekst',
                        subtitle: pageSlug ? `→ /${pageSlug}` : 'Ingen side valgt',
                      }
                    },
                  },
                },
              ],
            },
            {
              name: 'order',
              type: 'number',
              title: 'Rekkefølge',
              description: 'Rekkefølgen kolonnen vises (lavere tall først)',
              validation: (Rule) => Rule.required().min(0),
            },
          ],
          preview: {
            select: {
              title: 'columnTitle',
              order: 'order',
              links: 'links',
            },
            prepare({title, order, links}) {
              return {
                title: `${order}. ${title || 'Ingen tittel'}`,
                subtitle: links ? `${links.length} lenker` : 'Ingen lenker',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'autoPopulateFromPages',
      title: 'Auto-populer fra sider',
      type: 'boolean',
      description: 'Legg automatisk til alle sider som er merket "Vis i footer" i en egen kolonne',
      initialValue: true,
    }),
    defineField({
      name: 'autoColumnTitle',
      title: 'Automatisk kolonnetittel',
      type: 'string',
      description: 'Tittel for kolonnen med automatisk populerte sider',
      initialValue: 'Sider',
      hidden: ({parent}) => !parent?.autoPopulateFromPages,
    }),
    defineField({
      name: 'socialMedia',
      title: 'Sosiale medier',
      type: 'array',
      description: 'Lenker til sosiale medier',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              type: 'string',
              title: 'Plattform',
              description: 'Navn på plattformen',
              options: {
                list: [
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'Twitter/X', value: 'twitter'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'Pinterest', value: 'pinterest'},
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              type: 'url',
              title: 'URL',
              description: 'Full URL til profilen (f.eks. https://instagram.com/brukernavn)',
              validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
            },
          ],
          preview: {
            select: {
              platform: 'platform',
              url: 'url',
            },
            prepare({platform, url}) {
              return {
                title: platform || 'Ukjent plattform',
                subtitle: url,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright-tekst',
      type: 'string',
      description: 'Copyright-tekst som vises nederst i footer (f.eks. "© 2024 Bedriftsnavn")',
    }),
    defineField({
      name: 'additionalText',
      title: 'Tilleggstekst',
      type: 'text',
      description: 'Eventuell tilleggstekst som vises nederst i footer',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      companyName: 'companyInfo.companyName',
      columns: 'navigationColumns',
    },
    prepare({title, companyName, columns}) {
      return {
        title: title || 'Footer',
        subtitle: companyName
          ? `${companyName} - ${columns?.length || 0} kolonner`
          : `${columns?.length || 0} kolonner`,
      }
    },
  },
})
