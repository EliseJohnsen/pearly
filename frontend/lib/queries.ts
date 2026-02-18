import {groq} from 'next-sanity'

// Navigation queries
export const navigationQuery = groq`*[_type == "navigation"]|order(order asc){_id,title,"href": "/" + page->slug.current,order,type,variant}`

export const navigationByTypeQuery = (type: string) => groq`*[_type == "navigation" && type == "${type}"]|order(order asc){_id,title,"href": "/" + page->slug.current,order,type,variant}`

// Hero/CTA query
export const heroQuery = groq`*[_type == "hero" && isActive == true][0]{_id,heading,subheading,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},ctaButton{text,href},isActive}`

// Banner query
export const bannerQuery = groq`*[_type == "banner" && isActive == true][0]{_id,text,backgroundColor,isActive,link{text,href}}`

// How It Works query
export const howItWorksQuery = groq`*[_type == "howItWorks"][0]{_id,sectionTitle,sectionSubtitle,steps[]{title,description,icon,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt},order}|order(order asc)}`

// UI Strings queries
export const uiStringsQuery = groq`*[_type == "uiStrings"]{_id,key,value,category,description}`

export const uiStringsByCategoryQuery = (category: string) => groq`*[_type == "uiStrings" && category == "${category}"]{_id,key,value,category}`

export const uiStringByKeyQuery = (key: string) => groq`*[_type == "uiStrings" && key == "${key}"][0]{_id,key,value}`

// Page Settings query
export const pageSettingsQuery = (page: string) => groq`*[_type == "pageSettings" && page == "${page}"][0]{_id,page,title,description,ogImage{asset->{_id,url},alt},favicon{asset->{_id,url}}}`

// Email Template query
export const emailTemplateQuery = (templateId: string) => groq`*[_type == "emailTemplate" && templateId == "${templateId}"][0]{_id,templateId,subject,heading,body,ctaText,ctaUrl,footerText}`
export const allEmailTemplatesQuery = groq`*[_type == "emailTemplate"]{_id,templateId,subject,heading,body,ctaText,ctaUrl,footerText}`

// Page queries
export const pageBySlugQuery = (slug: string) => groq`*[_type == "page" && slug.current == "${slug}"][0]{
  _id,
  title,
  slug,
  seoMetadata,
  uiStrings,
  sections[]{
    _type,
    _type == "hero" => {
      heading,
      subheading,
      image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},
      imageWidth,
      ctaButton{text,href},
      isActive
    },
    _type == "banner" => {
      text,
      type,
      backgroundColor,
      isActive,
      link{text,href}
    },
    _type == "howItWorks" => {
      sectionTitle,
      sectionSubtitle,
      fontColor,
      backgroundColor,
      steps[]{title,description,icon,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt},order}
    },
    _type == "productsSection" => {
      sectionTitle,
      sectionSubtitle,
      products[]->{_id,title,slug,description,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt},category->{_id,name,slug,description},difficulty},
      showFeaturedOnly
    },
    _type == "content" => {
      title,
      backgroundColor,
      body
    }
  },
}`

export const allPublishedPagesQuery = groq`*[_type == "page"]{_id,title,slug}`

// Footer queries
export const footerQuery = groq`*[_type == "footer"][0]{
  _id,
  title,
  companyInfo{
    companyName,
    email,
    description,
    logo{asset->{_id,url}}
  },
  navigationColumns[]{
    columnTitle,
    links[]{
      linkText,
      page->{_id,title,slug}
    },
    order
  }|order(order asc),
  autoPopulateFromPages,
  autoColumnTitle,
  socialMedia[]{
    platform,
    url
  },
  copyrightText,
  additionalText
}`

export const footerPagesQuery = groq`*[_type == "page" && showInFooter == true]|order(footerOrder asc){_id,title,slug,footerOrder}`

// Coming Soon query
export const comingSoonQuery = groq`*[_type == "comingSoon" && isActive == true][0]{_id,logo{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,width},heading,headingFontSize,subheading,subheadingFontSize,backgroundColor,textColor,isActive}`

// Query for fetching product details
export const productQuery = groq`*[_type == "products" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  description,
  longDescription,
  productType,
  status,
  difficulty,
  patternBeadWidth,
  patternBeadHeight,
  totalBeads,
  colors,
  category->{
    _id,
    name,
    slug,
    description
  },
  gridSize,
  tags,
  currency,
  vatRate,
  "images": images[]{
    asset->{_id, url, metadata{lqip, dimensions{width, height}}},
    alt,
    isPrimary
  },
  image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt},
  price,
  originalPrice,
  seo{
    metaTitle,
    metaDescription,
    keywords
  }
}`;

export const productsByIdsQuery = groq`*[_type == "products" && _id in $ids]{
  _id,
  title,
  patternId,
}`;

export const productsByPatternIdQuery = groq`*[_type == "products" && patternId == $patternId]{
  _id,
  slug,
  title,

  "images": images[]{
    asset->{_id, url, metadata{lqip, dimensions{width, height}}},
    alt,
    isPrimary
  },
}`;