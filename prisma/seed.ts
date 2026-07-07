import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando la carga de datos (Seeding)...')

  // 1. Inicializar Settings
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '50376772999'
  const messenger = process.env.NEXT_PUBLIC_MESSENGER_HANDLE || 'creaciones1.sv'
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'creations.sv_'

  console.log('Configurando tabla Settings...')
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      whatsappNumber: whatsapp,
      messengerHandle: messenger,
      instagramHandle: instagram,
    },
    create: {
      id: 'singleton',
      whatsappNumber: whatsapp,
      messengerHandle: messenger,
      instagramHandle: instagram,
    },
  })

  console.log('Seeding completado con éxito! 🎉')
}

main()
  .catch((e) => {
    console.error('Error en la ejecución del seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end() // Cerrar el pool de conexiones pg
  })
