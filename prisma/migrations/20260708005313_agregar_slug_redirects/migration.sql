-- CreateTable
CREATE TABLE "slug_redirects" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "costumeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slug_redirects_oldSlug_key" ON "slug_redirects"("oldSlug");

-- CreateIndex
CREATE INDEX "slug_redirects_costumeId_idx" ON "slug_redirects"("costumeId");

-- AddForeignKey
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "costumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
