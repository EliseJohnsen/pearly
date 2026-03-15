import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'kampanjebanner',
  title: 'Kampanjebanner',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri tittel for banneret',
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
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
          ],
          lists: [],
          marks: {
            decorators: [
              {title: 'Fet', value: 'strong'},
              {title: 'Kursiv', value: 'em'},
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
      description: 'CSS-farge for bakgrunnen (f.eks. var(--primary-pink) eller #fff)',
      initialValue: 'var(--background)',
    }),
    defineField({
      name: 'link',
      title: 'Lenke',
      type: 'string',
      description: 'Valgfri lenke — gjør hele banneret klikkbart (f.eks. /produkter eller https://...)',
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
        title: title || 'Kampanjebanner',
        subtitle: subtitle || 'Ingen tekst',
      }
    },
  },
})
