import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'imageCarousel',
  title: 'Bildekarusell',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      description: 'Hovedoverskrift for seksjonen',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      description: 'Beskrivende tekst under overskriften',
      rows: 3,
    }),
    defineField({
      name: 'images',
      title: 'Bilder',
      type: 'array',
      description: 'Bilder som vises i karusellen (min 3, maks 8)',
      of: [
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
              description: 'Beskrivelse av bildet for tilgjengelighet',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(3).max(8),
    }),
    defineField({
      name: 'autoRotate',
      title: 'Automatisk rotasjon',
      type: 'boolean',
      description: 'Skal karusellen automatisk bytte bilde?',
      initialValue: true,
    }),
    defineField({
      name: 'rotationInterval',
      title: 'Rotasjonsintervall (sekunder)',
      type: 'number',
      description: 'Hvor mange sekunder mellom hvert bildeskift',
      initialValue: 5,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {autoRotate?: boolean}
          if (parent?.autoRotate && !value) {
            return 'Du må angi et rotasjonsintervall når automatisk rotasjon er aktivert'
          }
          if (value && value < 2) {
            return 'Intervallet må være minst 2 sekunder'
          }
          return true
        }),
      hidden: ({parent}) => !parent?.autoRotate,
    }),
    defineField({
      name: 'ctaButton',
      title: 'Call-to-Action knapp',
      type: 'object',
      description: 'Knapp som leder brukeren videre',
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
          title: 'Lenke (URL)',
          description: 'URL ellersti knappen skal lede til (f.eks. /produkter/custom)',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Skal denne seksjonen vises på siden?',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      images: 'images',
      media: 'images.0',
    },
    prepare({title, images, media}) {
      return {
        title: title || 'Bildekarusell',
        subtitle: images ? `${images.length} bilder` : 'Ingen bilder',
        media,
      }
    },
  },
})
