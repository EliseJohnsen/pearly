import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'emailTemplate',
  title: 'Email Template',
  type: 'document',
  fields: [
    defineField({
      name: 'templateId',
      title: 'Template ID',
      type: 'string',
      description: 'Unique identifier used in code (e.g., "welcome", "password-reset")',
      validation: (Rule) =>
        Rule.required().custom((templateId) => {
          // Validate template ID format: lowercase with hyphens
          if (!/^[a-z0-9-]+$/.test(templateId || '')) {
            return 'Template ID must contain only lowercase letters, numbers, and hyphens'
          }
          return true
        }),
    }),
    defineField({
      name: 'subject',
      title: 'Email Subject',
      type: 'string',
      description: 'Subject line for the email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Email Heading',
      type: 'string',
      description: 'Main heading displayed in the email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Email Body',
      type: 'array',
      description: 'Rich text content for the email body',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
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
    }),
    defineField({
      name: 'ctaText',
      title: 'Call to Action Text',
      type: 'string',
      description: 'Optional button text',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Call to Action URL',
      type: 'string',
      description: 'URL for the CTA button',
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'text',
      description: 'Optional footer text at the bottom of the email',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'templateId',
      subtitle: 'subject',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled Template',
        subtitle: subtitle || 'No subject',
      }
    },
  },
})
