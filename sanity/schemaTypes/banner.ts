import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'banner',
  title: 'Kampanjebanner (global)',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Skru banneret av/på',
      initialValue: true,
    }),
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
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
      description: 'Velg bakgrunnsfarge for banneret',
      initialValue: 'var(--primary-neon-green)',
      options: {
        list: [
          {title: 'Mørk rosa', value: 'var(--primary-dark-pink)'},
          {title: 'Lavendel rosa', value: 'var(--lavender-pink)'},
          {title: 'Lilla', value: 'var(--purple)'},
          {title: 'Mørk lilla', value: 'var(--dark-purple)'},
          {title: 'Ekstra mørk lilla', value: 'var(--purple-extra-dark)'},
          {title: 'Neon grønn', value: 'var(--primary-neon-green)'},
          {title: 'Oransje/rød (primær)', value: 'var(--primary)'},
        ],
      },
    }),
    defineField({
      name: 'customBackgroundColor',
      title: 'Egendefinert bakgrunnsfarge (HEX)',
      type: 'string',
      description: 'Skriv inn en HEX-kode (f.eks. #F5EDE8) — overstyrer fargevalget over',
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
      isActive: 'isActive',
    },
    prepare({title, isActive}) {
      return {
        title: isActive ? (title || 'Kampanjebanner') : `[INAKTIV] ${title || 'Kampanjebanner'}`,
      }
    },
  },
})
