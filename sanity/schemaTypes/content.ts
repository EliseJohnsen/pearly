import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'content',
  title: 'Innholdsseksjon',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri tittel for innholdsseksjonen',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      type: 'array',
      description: 'Rikt tekstinnhold med formatering',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Sitat', value: 'blockquote'},
          ],
          lists: [
            {title: 'Punktliste', value: 'bullet'},
            {title: 'Nummerert liste', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Fet', value: 'strong'},
              {title: 'Kursiv', value: 'em'},
              {title: 'Understrek', value: 'underline'},
              {title: 'Gjennomstrekning', value: 'strike-through'},
              {title: 'Kode', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Lenke',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) =>
                      Rule.uri({
                        allowRelative: true,
                        scheme: ['http', 'https', 'mailto', 'tel'],
                      }),
                  },
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Åpne i ny fane',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternativ tekst',
              description: 'Viktig for tilgjengelighet og SEO',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Bildetekst',
              description: 'Valgfri bildetekst som vises under bildet',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      body: 'body',
    },
    prepare({title, body}) {
      const block = body?.find((item: any) => item._type === 'block')
      const subtitle = block
        ? block.children
            ?.map((child: any) => child.text)
            .join('')
            .substring(0, 100)
        : 'Tomt innhold'

      return {
        title: title || 'Innholdsseksjon',
        subtitle: subtitle || 'Ingen tekst',
      }
    },
  },
})
