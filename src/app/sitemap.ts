import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sevgikeskinbeauty.com'

  const routes = [
    '',
    '/hakkimizda',
    '/hizmetlerimiz',
    '/iletisim',
    '/musteri-deneyimleri',
    '/rezervasyon',
    '/bakim'
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
