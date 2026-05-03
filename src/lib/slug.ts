export function generateSlug(ad: {
  title: string
  category?: string
  province?: string
  id: string
}): string {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)

  const parts = [
    normalize(ad.title || ''),
    ad.province ? normalize(ad.province) : '',
    ad.id.replace(/-/g, '').slice(0, 8),
  ].filter(Boolean)

  return parts.join('-')
}

export function extractIdFromSlug(slug: string): string {
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

export function isFullUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}
