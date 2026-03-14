import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'splitSection',
  title: 'Split-seksjon (bilde + tekst)',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Brødtekst',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'button',
      title: 'Knapp',
      type: 'object',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Knappetekst',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'href',
          type: 'string',
          title: 'Lenke',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternativ tekst',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'imagePosition',
      title: 'Bildeposisjon',
      type: 'string',
      description: 'Skal bildet stå til venstre eller høyre for teksten?',
      options: {
        list: [
          {title: 'Venstre', value: 'left'},
          {title: 'Høyre', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
      description: 'CSS-farge for bakgrunnen (f.eks. var(--background) eller #fff)',
      initialValue: 'var(--background)',
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      media: 'image',
      imagePosition: 'imagePosition',
      isActive: 'isActive',
    },
    prepare({title, media, imagePosition, isActive}) {
      return {
        title: isActive ? title : `[INAKTIV] ${title}`,
        subtitle: `Bilde ${imagePosition === 'left' ? 'til venstre' : 'til høyre'}`,
        media,
      }
    },
  },
})
