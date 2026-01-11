import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'roomTemplate',
  title: 'Interiørbilder (Room Templates)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Navn',
      type: 'string',
      description: 'Beskrivende navn, f.eks. "Stue - 2x2"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Interiørbilde',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
      description: 'Interiørbilde hvor mønsteret skal plasseres',
    }),
    defineField({
      name: 'boardsDimension',
      title: 'Brett-dimensjon',
      type: 'string',
      description: 'Format: "WxH" f.eks. "2x2", "4x4"',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          if (!value) return 'Brett-dimensjon er påkrevd'
          const pattern = /^\d+x\d+$/
          if (!pattern.test(value)) {
            return 'Format må være "WxH" f.eks. "2x2" eller "4x4"'
          }
          return true
        }),
    }),
    defineField({
      name: 'frameZone',
      title: 'Ramme-sone (Frame Zone)',
      type: 'object',
      description: 'Koordinater for hvor mønsteret skal plasseres på veggen',
      fields: [
        defineField({
          name: 'topLeft',
          title: 'Øvre venstre hjørne',
          type: 'object',
          fields: [
            {name: 'x', type: 'number', title: 'X', validation: (Rule) => Rule.required()},
            {name: 'y', type: 'number', title: 'Y', validation: (Rule) => Rule.required()},
          ],
        }),
        defineField({
          name: 'topRight',
          title: 'Øvre høyre hjørne',
          type: 'object',
          fields: [
            {name: 'x', type: 'number', title: 'X', validation: (Rule) => Rule.required()},
            {name: 'y', type: 'number', title: 'Y', validation: (Rule) => Rule.required()},
          ],
        }),
        defineField({
          name: 'bottomLeft',
          title: 'Nedre venstre hjørne',
          type: 'object',
          fields: [
            {name: 'x', type: 'number', title: 'X', validation: (Rule) => Rule.required()},
            {name: 'y', type: 'number', title: 'Y', validation: (Rule) => Rule.required()},
          ],
        }),
        defineField({
          name: 'bottomRight',
          title: 'Nedre høyre hjørne',
          type: 'object',
          fields: [
            {name: 'x', type: 'number', title: 'X', validation: (Rule) => Rule.required()},
            {name: 'y', type: 'number', title: 'Y', validation: (Rule) => Rule.required()},
          ],
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'frameSettings',
      title: 'Ramme-innstillinger',
      type: 'object',
      description: 'Innstillinger for ramme og passepartout',
      fields: [
        defineField({
          name: 'hasFrame',
          title: 'Vis ramme',
          type: 'boolean',
          description: 'Skal mønsteret ha en ramme?',
          initialValue: true,
        }),
        defineField({
          name: 'frameColor',
          title: 'Rammefarge',
          type: 'string',
          options: {
            list: [
              {title: 'Svart', value: 'black'},
              {title: 'Hvit', value: 'white'},
              {title: 'Gull', value: 'gold'},
              {title: 'Tre (lys)', value: 'wood-light'},
              {title: 'Tre (mørk)', value: 'wood-dark'},
            ],
          },
          initialValue: 'black',
          hidden: ({parent}) => !parent?.hasFrame,
        }),
        defineField({
          name: 'frameWidth',
          title: 'Rammebredde (%)',
          type: 'number',
          description: 'Rammebredde som prosentandel av bildebredde (standard: 8)',
          initialValue: 8,
          validation: (Rule) => Rule.min(2).max(20),
          hidden: ({parent}) => !parent?.hasFrame,
        }),
        defineField({
          name: 'hasPassepartout',
          title: 'Vis passepartout',
          type: 'boolean',
          description: 'Skal det være en kremhvit passepartout innenfor rammen?',
          initialValue: false,
          hidden: ({parent}) => !parent?.hasFrame,
        }),
        defineField({
          name: 'passepartoutWidth',
          title: 'Passepartout-bredde (%)',
          type: 'number',
          description: 'Passepartout-bredde som prosentandel av bildebredde (standard: 12)',
          initialValue: 12,
          validation: (Rule) => Rule.min(5).max(30),
          hidden: ({parent}) => !parent?.hasFrame || !parent?.hasPassepartout,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      dimension: 'boardsDimension',
    },
    prepare(selection) {
      const {title, media, dimension} = selection
      return {
        title,
        subtitle: `Brett: ${dimension}`,
        media,
      }
    },
  },
})
