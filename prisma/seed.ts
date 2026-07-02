import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { categories as mockCategories, costumes as mockCostumes } from "../lib/data";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parsePriceRange(range?: string): [number, number] {
  if (!range) return [0, 0];
  const numbers = range.match(/[\d.]+/g);
  if (!numbers || numbers.length < 2) return [Number(numbers?.[0] ?? 0), 0];
  return [Number(numbers[0]), Number(numbers[1])];
}

function mapAudience(audience: string): "KIDS" | "ADULTS" | "ALL" {
  if (audience === "Kids") return "KIDS";
  if (audience === "Adults") return "ADULTS";
  return "ALL";
}

async function main() {
  console.log("Iniciando la carga de datos (Seeding)...");

  // 1. Inicializar Settings
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50376772999";
  const messenger = process.env.NEXT_PUBLIC_MESSENGER_HANDLE || "creaciones1.sv";
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "creations.sv_";

  console.log("Configurando tabla Settings...");
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      whatsappNumber: whatsapp,
      messengerHandle: messenger,
      instagramHandle: instagram,
    },
    create: {
      id: "singleton",
      whatsappNumber: whatsapp,
      messengerHandle: messenger,
      instagramHandle: instagram,
    },
  });

  // Limpiar disfraces e imágenes existentes
  console.log("Limpiando datos existentes de disfraces y categorías...");
  await prisma.image.deleteMany({});
  await prisma.costume.deleteMany({});
  await prisma.category.deleteMany({});

  // 2. Crear Categorías y mapear sus slugs a sus IDs generados
  console.log("Creando categorías...");
  const categorySlugToId: Record<string, string> = {};

  for (const cat of mockCategories) {
    const createdCategory = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        imageKey: `categories/${cat.slug}`,
      },
    });
    categorySlugToId[cat.slug] = createdCategory.id;
    console.log(`- Categoría creada: ${cat.name} (${cat.slug})`);
  }

  // 3. Crear Disfraces e Imágenes asociadas
  console.log("Creando disfraces...");
  for (const cos of mockCostumes) {
    const [priceMin, priceMax] = parsePriceRange(cos.priceRange);
    const categoryId = categorySlugToId[cos.categorySlug];

    if (!categoryId) {
      console.warn(`Advertencia: Categoría no encontrada para el disfraz ${cos.name} (slug: ${cos.categorySlug})`);
      continue;
    }

    const createdCostume = await prisma.costume.create({
      data: {
        name: cos.name,
        slug: cos.slug,
        shortDescription: cos.shortDescription,
        description: cos.description,
        priceMin,
        priceMax,
        estimatedTime: cos.creationTime,
        audience: mapAudience(cos.audience),
        tags: cos.tags,
        featured: cos.featured || false,
        published: cos.published !== false,
        categoryId,
      },
    });

    console.log(`- Disfraz creado: ${cos.name} (${cos.slug})`);

    // Crear imágenes del disfraz
    if (cos.images && cos.images.length > 0) {
      for (let i = 0; i < cos.images.length; i++) {
        const imageUrl = cos.images[i];
        await prisma.image.create({
          data: {
            url: imageUrl,
            key: `costumes/${createdCostume.id}/${i + 1}`,
            alt: `Imagen de ${cos.name}`,
            order: i,
            costumeId: createdCostume.id,
          },
        });
      }
      console.log(`  └─ ${cos.images.length} imágenes asociadas.`);
    }
  }

  console.log("Seeding completado con éxito! 🎉");
}

main()
  .catch((e) => {
    console.error("Error en la ejecución del seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Cerrar el pool de conexiones pg
  });
