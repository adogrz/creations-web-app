import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Costume } from "@/lib/types";

export function CostumeCard({ costume }: { costume: Costume }) {
  const priceDisplay =
    costume.priceMin === costume.priceMax
      ? `$${costume.priceMin}`
      : `$${costume.priceMin} – $${costume.priceMax}`;

  return (
    <Link
      href={`/costumes/${costume.slug}`}
      className="group flex flex-col transition-all duration-300"
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-4xl bg-muted ring-1 ring-foreground/5">
        <Image
          src={costume.images[0]?.url || "/placeholder.svg"}
          alt={costume.images[0]?.alt || costume.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-102"
        />
        <div className="absolute left-4 top-4">
          <Badge
            variant="secondary"
            className="backdrop-blur-sm bg-background/70 border-none px-3 py-1 text-xs"
          >
            {costume.category?.name}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pt-3.5 px-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-medium leading-snug text-balance text-foreground group-hover:text-primary transition-colors duration-200">
            {costume.name}
          </h3>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground/60 transition-[color] duration-200 group-hover:text-primary mt-1"
            aria-hidden="true"
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {costume.shortDescription}
        </p>
        <div className="flex items-center justify-between pt-1 text-xs font-semibold text-primary">
          <span className="tabular-nums">{priceDisplay}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {costume.audience === "KIDS"
              ? "Niños"
              : costume.audience === "ADULTS"
                ? "Adultos"
                : "Todo público"}
          </span>
        </div>
      </div>
    </Link>
  );
}
