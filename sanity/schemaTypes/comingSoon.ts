import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'comingSoon',
  title: 'Coming Soon Page',
  type: 'document',
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Logo som vises på forsiden',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'width',
          type: 'number',
          title: 'Bredde',
          description: 'Bredde i antall piksler',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Hovedoverskrift',
      type: 'string',
      description: 'Hovedtekst på forsiden',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'headingFontSize',
      title: 'Fontstørrelse for hovedoverskrift',
      type: 'number',
      description: 'Fontstørrelse i piksler (f.eks. 48)',
      validation: (Rule) => Rule.min(12).max(200),
      initialValue: 48,
    }),
    defineField({
      name: 'subheading',
      title: 'Undertekst',
      type: 'text',
      description: 'Beskrivende tekst under hovedoverskriften',
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'subheadingFontSize',
      title: 'Fontstørrelse for undertekst',
      type: 'number',
      description: 'Fontstørrelse i piksler (f.eks. 24)',
      validation: (Rule) => Rule.min(12).max(100),
      initialValue: 24,
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
      description: 'Hex-kode for bakgrunnsfarge (f.eks. #ffffff)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, {
          name: 'hex color',
          invert: false,
        }).error('Må være en gyldig hex-farge (f.eks. #ffffff)'),
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'textColor',
      title: 'Tekstfarge',
      type: 'string',
      description: 'Hex-kode for tekstfarge (f.eks. #000000)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, {
          name: 'hex color',
          invert: false,
        }).error('Må være en gyldig hex-farge (f.eks. #000000)'),
      initialValue: '#000000',
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Slå på/av Coming Soon-siden. Når den er av, vises normal side.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'subheading',
      media: 'logo',
      isActive: 'isActive',
    },
    prepare({title, subtitle, media, isActive}) {
      return {
        title: isActive ? `🟢 ${title}` : `⚪️ ${title}`,
        subtitle: isActive ? subtitle : '[INAKTIV] ' + subtitle,
        media,
      }
    },
  },
})
