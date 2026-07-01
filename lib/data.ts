export type Category = {
  slug: string
  name: string
  description: string
  image: string
}

export type Costume = {
  slug: string
  name: string
  categorySlug: string
  audience: 'Kids' | 'Adults' | 'All ages'
  shortDescription: string
  description: string
  priceRange: string
  priceMin?: number
  priceMax?: number
  creationTime: string
  tags: string[]
  images: string[]
  featured?: boolean
  published?: boolean
}

export const categories: Category[] = [
  {
    slug: 'fairytale',
    name: 'Cuentos de Hadas',
    description: 'Princesas, magos y maravillas de libros de cuentos.',
    image: '/images/costume-fairy.png',
  },
  {
    slug: 'fantasy',
    name: 'Fantasía',
    description: 'Dragones, criaturas y seres míticos.',
    image: '/images/costume-dragon.png',
  },
  {
    slug: 'animals',
    name: 'Animales',
    description: 'Tiernas criaturas y amigos del bosque.',
    image: '/images/costume-fox.png',
  },
  {
    slug: 'sci-fi',
    name: 'Ciencia Ficción',
    description: 'Exploradores del espacio y mundos futuros.',
    image: '/images/costume-astronaut.png',
  },
  {
    slug: 'historical',
    name: 'Históricos',
    description: 'Estilos elegantes de épocas pasadas.',
    image: '/images/costume-duchess.png',
  },
  {
    slug: 'halloween',
    name: 'Halloween',
    description: 'Espeluznantes, juguetones y llenos de encanto.',
    image: '/images/costume-vampire.png',
  },
]

export const costumes: Costume[] = [
  {
    slug: 'enchanted-fairy',
    name: 'Hada Encantada',
    categorySlug: 'fairytale',
    audience: 'Kids',
    shortDescription: 'Delicadas alas y tul en capas en tonos pastel suave.',
    description:
      'Un disfraz de ensueño confeccionado a mano con capas de tul suave, alas pintadas artesanalmente y una corona de flores. Cada pétalo y destello se añade con dedicación para hacer sentir a tu pequeña en un verdadero cuento de hadas.',
    priceRange: '$120 – $180',
    creationTime: '2 – 3 semanas',
    tags: ['tulle', 'wings', 'floral crown', 'handmade', 'kids'],
    images: ['/images/costume-fairy.png', '/images/costume-fairy-2.png'],
    featured: true,
  },
  {
    slug: 'brave-little-dragon',
    name: 'Pequeño Dragón Valiente',
    categorySlug: 'fantasy',
    audience: 'Kids',
    shortDescription: 'Escamas acolchadas, suaves espinas y una cola amigable.',
    description:
      'Un cómodo disfraz de dragón con escamas de fieltro acolchadas, una cola suave y capucha con espinas blandas. Cálido, ligero y diseñado para horas de juego imaginativo.',
    priceRange: '$140 – $200',
    creationTime: '3 – 4 semanas',
    tags: ['felt', 'hooded', 'tail', 'cozy', 'kids'],
    images: ['/images/costume-dragon.png', '/images/costume-dragon-2.png'],
    featured: true,
  },
  {
    slug: 'galactic-explorer',
    name: 'Explorador Galáctico',
    categorySlug: 'sci-fi',
    audience: 'All ages',
    shortDescription: 'Traje espacial retro-futurista con detalles artesanales.',
    description:
      'Un traje espacial de diseño único terminado con paneles trabajados a mano, parches de misión bordados y un cuello de casco de estructura suave. Diseñado para ofrecer total comodidad y una silueta llamativa.',
    priceRange: '$220 – $320',
    creationTime: '4 – 6 semanas',
    tags: ['spacesuit', 'embroidery', 'statement', 'unisex'],
    images: ['/images/costume-astronaut.png', '/images/costume-astronaut-2.png'],
    featured: true,
  },
  {
    slug: 'woodland-fox',
    name: 'Zorro del Bosque',
    categorySlug: 'animals',
    audience: 'Kids',
    shortDescription: 'Orejas esponjosas, una gran cola y colores cálidos de otoño.',
    description:
      'Un encantador disfraz de zorro con cola de piel sintética, orejas puntiagudas y un suave cuerpo tejido en tonos otoñales. Delicado con la piel y sumamente divertido.',
    priceRange: '$110 – $160',
    creationTime: '2 – 3 semanas',
    tags: ['faux fur', 'tail', 'knit', 'autumn', 'kids'],
    images: ['/images/costume-fox.png', '/images/costume-fox-2.png'],
    featured: true,
  },
  {
    slug: 'victorian-duchess',
    name: 'Duquesa Victoriana',
    categorySlug: 'historical',
    audience: 'Adults',
    shortDescription: 'Corsé estructurado con capas de falda fruncidas a mano.',
    description:
      'Un vestido de época elegante que presenta un corsé estructurado, falda fruncida a mano y un delicado ribete de encaje. Confeccionado a medida para una silueta clásica y atemporal.',
    priceRange: '$320 – $480',
    creationTime: '5 – 7 semanas',
    tags: ['gown', 'lace', 'tailored', 'period', 'adults'],
    images: ['/images/costume-duchess.png', '/images/costume-duchess-2.png'],
  },
  {
    slug: 'midnight-vampire',
    name: 'Vampiro de Medianoche',
    categorySlug: 'halloween',
    audience: 'Adults',
    shortDescription: 'Un diseño dramático con capa y forro de satén.',
    description:
      'Un conjunto teatral de vampiro con capa de cuello alto, forro de satén y acabados hechos a mano. Dramático pero cómodo para disfrutar toda la noche de celebración.',
    priceRange: '$180 – $260',
    creationTime: '3 – 4 semanas',
    tags: ['cape', 'satin', 'theatrical', 'adults'],
    images: ['/images/costume-vampire.png', '/images/costume-vampire-2.png'],
  },
  {
    slug: 'storybook-wizard',
    name: 'Mago de Cuentos',
    categorySlug: 'fairytale',
    audience: 'All ages',
    shortDescription: 'Túnica bordada con estrellas y un sombrero puntiagudo.',
    description:
      'Una túnica de mago de ensueño decorada con lunas y estrellas bordadas a mano, acompañada de un sombrero puntiagudo y suave. Ligera, fluida y llena de personalidad.',
    priceRange: '$150 – $220',
    creationTime: '3 – 4 semanas',
    tags: ['robe', 'embroidery', 'hat', 'whimsical'],
    images: ['/images/costume-wizard.png', '/images/costume-wizard-2.png'],
    featured: true,
  },
  {
    slug: 'autumn-owl',
    name: 'Búho de Otoño',
    categorySlug: 'animals',
    audience: 'Kids',
    shortDescription: 'Capa de plumas en capas en tonos dorados cálidos.',
    description:
      'Un tierno disfraz de búho confeccionado con capas de plumas de fieltro cortadas a mano, con una capucha suave y grandes ojos amigables. Cálido, abrazable y hermosamente detallado.',
    priceRange: '$120 – $170',
    creationTime: '2 – 3 semanas',
    tags: ['felt', 'feathers', 'hood', 'kids'],
    images: ['/images/costume-owl.png', '/images/costume-owl-2.png'],
  },
]

export function getCostumeBySlug(slug: string) {
  return costumes.find((c) => c.slug === slug)
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export function getCategoryName(slug: string) {
  return categories.find((c) => c.slug === slug)?.name ?? slug
}

export function getRelatedCostumes(costume: Costume, limit = 3) {
  return costumes
    .filter(
      (c) => c.slug !== costume.slug && c.categorySlug === costume.categorySlug,
    )
    .concat(
      costumes.filter(
        (c) =>
          c.slug !== costume.slug && c.categorySlug !== costume.categorySlug,
      ),
    )
    .slice(0, limit)
}

function getSettings() {
  const env = {
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '50376772999',
    messengerHandle: process.env.NEXT_PUBLIC_MESSENGER_HANDLE ?? 'creaciones1.sv',
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? 'creations.sv_',
  }
  if (typeof window === 'undefined') return env
  try {
    const raw = localStorage.getItem('creations_settings')
    if (!raw) return env
    return { ...env, ...JSON.parse(raw) }
  } catch {
    return env
  }
}

export function whatsappLink(costumeUrl?: string) {
  const { whatsappNumber } = getSettings()
  const text = costumeUrl
    ? `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    : `¡Hola Creations! Me encantaría conocer más sobre sus disfraces personalizados.`
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
}

export function messengerLink(costumeUrl?: string) {
  const { messengerHandle } = getSettings()
  const base = `https://www.facebook.com/messages/t/${messengerHandle}`
  if (costumeUrl) {
    const text = `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}

export function instagramLink(costumeUrl?: string) {
  const { instagramHandle } = getSettings()
  const base = `https://ig.me/m/${instagramHandle}`
  if (costumeUrl) {
    const text = `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}
