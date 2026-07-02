import type {
  Costume as PrismaCostume,
  Category as PrismaCategory,
  Image as PrismaImage,
} from "@/generated/client";

export type Category = PrismaCategory;
export type Image = PrismaImage;

export type Costume = PrismaCostume & {
  category: PrismaCategory;
  images: PrismaImage[];
};
