import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Categorías — Creations",
  description: "Explora nuestras categorías de disfraces hechos a mano.",
};

export default async function CategoriesPage() {
  const categoriesWithCounts = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          costumes: {
            where: { published: true },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Categorías
        </h1>
        <p className="mt-3 text-lg text-muted-foreground text-pretty">
          Desde cuentos de hadas hasta ciencia ficción, encuentra el estilo que
          despierte tu imaginación.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesWithCounts.map((category) => {
          const count = category._count.costumes;
          return (
            <Link
              key={category.slug}
              href={`/costumes?category=${category.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-16/10 overflow-hidden rounded-[2.5rem] rounded-tr-none bg-muted ring-1 ring-foreground/5">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <div className="mt-4 flex flex-col gap-1 px-2">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-heading text-xl font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                    {category.name}
                  </h2>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground/60 transition-[color] duration-200 group-hover:text-primary mt-1"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {category.description}
                </p>
                <span className="text-xs font-semibold text-primary/80 mt-1.5 tabular-nums">
                  {count} {count === 1 ? "creación" : "creaciones"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
