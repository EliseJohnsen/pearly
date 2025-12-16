import {groq} from 'next-sanity'

// Navigation queries
export const navigationQuery = groq`*[_type == "navigation"]|order(order asc){_id,title,href,order,type,variant}`

export const navigationByTypeQuery = (type: string) => groq`*[_type == "navigation" && type == "${type}"]|order(order asc){_id,title,href,order,type,variant}`

// Hero/CTA query
export const heroQuery = groq`*[_type == "hero" && isActive == true][0]{_id,heading,subheading,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},ctaButton{text,href},isActive}`

// Banner query
export const bannerQuery = groq`*[_type == "banner" && isActive == true][0]{_id,text,type,backgroundColor,isActive,link{text,href}}`

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

// Inspiration queries
export const inspirationQuery = groq`*[_type == "inspiration"]|order(order asc){_id,title,slug,description,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},category,difficulty,colors,gridSize,tags,isFeatured,order}`

export const featuredInspirationQuery = groq`*[_type == "inspiration" && isFeatured == true]|order(order asc){_id,title,slug,description,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},category,difficulty,colors,gridSize,tags,isFeatured,order}`

export const inspirationBySlugQuery = (slug: string) => groq`*[_type == "inspiration" && slug.current == "${slug}"][0]{_id,title,slug,description,image{asset->{_id,url,metadata{lqip,dimensions{width,height}}},alt,hotspot},category,difficulty,colors,gridSize,tags,isFeatured,order}`
