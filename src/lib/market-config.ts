export const LAUNCH_CITIES = ['Kigali']

export const LAUNCH_MAIN_CATEGORIES = [
  { value: 'immo', label: 'Immo', navbar: true },
  { value: 'mode', label: 'Vetements', navbar: true },
  { value: 'vehicule', label: 'Vehicules', navbar: true },
  { value: 'emploi-service', label: 'Emploi & services', navbar: true },
  { value: 'animaux', label: 'Animaux', navbar: true },
  { value: 'fourniture', label: 'Fourniture', navbar: true },
  { value: 'tech', label: 'Tech', navbar: true },
  { value: 'divers', label: 'Divers', navbar: true },
] as const

export const LAUNCH_SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  immo: [
    { value: 'immo-vente', label: 'Vente immobiliere' },
    { value: 'immo-location', label: 'Location immobiliere' },
    { value: 'immo-terrain', label: 'Terrain' },
  ],
  vehicule: [
    { value: 'voiture', label: 'Voiture' },
    { value: 'moto', label: 'Moto' },
  ],
  'emploi-service': [
    { value: 'emploi', label: 'Emploi' },
    { value: 'services', label: 'Service' },
  ],
  fourniture: [
    { value: 'maison', label: 'Maison et mobilier' },
    { value: 'materiaux', label: 'Materiaux construction' },
  ],
  tech: [
    { value: 'electronique', label: 'Electronique' },
  ],
  divers: [
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'sante', label: 'Sante et beaute' },
    { value: 'sport', label: 'Sport et loisirs' },
    { value: 'education', label: 'Education' },
  ],
}

export const CATEGORY_GROUPS: Record<string, string[]> = {
  immo: ['immo-vente', 'immo-location', 'immo-terrain'],
  vehicule: ['vehicule', 'voiture', 'moto'],
  'emploi-service': ['emploi-service', 'emploi', 'services'],
  fourniture: ['fourniture', 'maison', 'materiaux'],
  tech: ['tech', 'electronique'],
  divers: ['divers', 'agriculture', 'sante', 'sport', 'education'],
}

export const matchesCategoryGroup = (selectedCategory: string, adCategory?: string | null) => {
  if (!selectedCategory || !adCategory) return true
  return (CATEGORY_GROUPS[selectedCategory] || [selectedCategory]).includes(adCategory)
}
