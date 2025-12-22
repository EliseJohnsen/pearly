// Sanity image type
export interface SanityImage {
  asset: {
    _id: string
    url: string
    metadata?: {
      lqip?: string
      dimensions?: {
        width: number
        height: number
      }
    }
  }
  alt?: string
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
}

// Navigation types
export interface Navigation {
  _id: string
  title: string
  href: string
  order: number
  type: 'main' | 'cta' | 'footer'
  variant: 'default' | 'primary' | 'secondary'
}

// Hero/CTA types
export interface Hero {
  _id: string
  heading: string
  subheading?: string
  image?: SanityImage
  imageWidth?: string
  ctaButton?: {
    text: string
    href: string
  }
  isActive: boolean
}

// Banner types
export interface Banner {
  _id: string
  text: string
  type: 'info' | 'warning' | 'success' | 'promo'
  backgroundColor?: string
  isActive: boolean
  link?: {
    text: string
    href: string
  }
}

// How It Works types
export interface HowItWorksStep {
  title: string
  description: string
  icon?: string
  image?: SanityImage
  order: number
}

export interface HowItWorks {
  _id: string
  sectionTitle: string
  sectionSubtitle?: string
  backgroundColor?: string
  fontColor?: string
  steps: HowItWorksStep[]
}

// UI Strings types
export interface UIString {
  _id: string
  key: string
  value: string
  category: 'forms' | 'buttons' | 'messages' | 'navigation' | 'validation' | 'labels' | 'general'
  description?: string
}

// Page Settings types
export interface PageSettings {
  _id: string
  page: string
  title: string
  description: string
  ogImage?: SanityImage
  favicon?: SanityImage
}

// Email Template types
export interface EmailTemplate {
  _id: string
  templateId: string
  subject: string
  heading: string
  body: any[] // Portable Text blocks
  ctaText?: string
  ctaUrl?: string
  footerText?: string
}

// Inspiration types
export interface Inspiration {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  image: SanityImage
  category?: 'animals' | 'nature' | 'abstract' | 'characters' | 'holiday' | 'other'
  difficulty?: 'easy' | 'medium' | 'hard'
  colors?: number
  gridSize?: string
  tags?: string[]
  isFeatured: boolean
  order: number
}

export interface Footer {
  _id: string,
  title: string,
  comapnyInfo: {
    companyName: string,
  }
}
