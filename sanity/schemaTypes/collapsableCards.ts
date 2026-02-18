import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'collapsableCards',
  title: 'Collapsable Cards',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Seksjonstittel',
      type: 'string',
      description: 'Overskrift for seksjonen (f.eks. "Sånn funker det")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      description: 'Individuelle collapsable cards',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'header',
              type: 'string',
              title: 'Overskrift',
              description: 'Overskrift for cardet',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'icon',
              type: 'string',
              title: 'Ikon',
              description: 'Heroicon navn (f.eks. "ArrowUpTrayIcon", "MapPinIcon", "ArrowPathIcon", "QuestionMarkCircleIcon")',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'content',
              type: 'array',
              title: 'Innhold',
              description: 'Innholdet som vises når cardet er åpnet',
              of: [
                {
                  type: 'block',
                  styles: [
                    {title: 'Normal', value: 'normal'},
                    {title: 'H3', value: 'h3'},
                    {title: 'H4', value: 'h4'},
                  ],
                  lists: [
                    {title: 'Punktliste', value: 'bullet'},
                    {title: 'Nummerert liste', value: 'number'},
                  ],
                  marks: {
                    decorators: [
                      {title: 'Fet', value: 'strong'},
                      {title: 'Kursiv', value: 'em'},
                    ],
                    annotations: [
                      {
                        name: 'link',
                        type: 'object',
                        title: 'Lenke',
                        fields: [
                          {
                            name: 'href',
                            type: 'string',
                            title: 'URL',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'defaultExpanded',
              type: 'boolean',
              title: 'Åpen som standard',
              description: 'Skal cardet være åpent når siden lastes?',
              initialValue: false,
            },
            {
              name: 'order',
              type: 'number',
              title: 'Rekkefølge',
              description: 'Rekkefølgen cardet vises i (lavere tall først)',
              validation: (Rule) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              title: 'header',
              icon: 'icon',
              order: 'order',
            },
            prepare({title, icon, order}) {
              return {
                title: `${order}. ${title}`,
                subtitle: icon ? `Ikon: ${icon}` : 'Ingen ikon',
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
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
      title: 'sectionTitle',
      cards: 'cards',
    },
    prepare({title, cards}) {
      return {
        title: title || 'Collapsable Cards',
        subtitle: cards ? `${cards.length} cards` : 'Ingen cards',
      }
    },
  },
})
