'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect, useTransition } from 'react'
import { UploadCloud, X, Star, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCostumeAction, updateCostumeAction } from '@/app/admin/actions/costume-actions'
import { uploadImageAction, deleteImageAction } from '@/app/admin/actions/upload-actions'
import { toast } from 'sonner'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type FormImage = {
  id?: string
  url: string
  key: string
  alt?: string
}

type FormCostume = {
  id: string
  name: string
  slug: string
  categoryId: string
  categorySlug: string
  audience: string
  shortDescription: string
  description: string
  priceMin: number
  priceMax: number
  priceRange: string
  creationTime: string
  tags: string[]
  images: FormImage[]
  featured: boolean
  published: boolean
}

type CategoryItem = {
  id: string
  name: string
  slug: string
}

type AdminFormProps = {
  costume?: FormCostume
  categories: CategoryItem[]
}

type GalleryItem = {
  id?: string
  url: string
  key?: string
  file?: File
  isDeleted?: boolean
}

export function AdminForm({ costume, categories }: AdminFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [categoryId, setCategoryId] = useState(costume?.categoryId ?? '')
  const [audience, setAudience] = useState(
    costume?.audience === 'Kids' ? 'KIDS' : costume?.audience === 'Adults' ? 'ADULTS' : 'ALL'
  )
  const [published, setPublished] = useState(costume?.published ?? true)
  const [featured, setFeatured] = useState(costume?.featured ?? false)

  const [priceMin, setPriceMin] = useState(costume?.priceMin ? String(costume.priceMin) : '')
  const [priceMax, setPriceMax] = useState(costume?.priceMax ? String(costume.priceMax) : '')
  
  const [isPending, startTransition] = useTransition()

  // Galería unificada para manejar imágenes de base de datos y archivos locales pendientes
  const [gallery, setGallery] = useState<GalleryItem[]>(() => 
    costume?.images.map(img => ({ id: img.id, url: img.url, key: img.key })) ?? []
  )

  // Sincronizar galería si cambia el disfraz
  useEffect(() => {
    if (costume) {
      setGallery(costume.images.map(img => ({ id: img.id, url: img.url, key: img.key })))
    }
  }, [costume])

  // Mostrar solo las imágenes que no han sido marcadas para borrar
  const visibleImages = gallery.filter(item => !item.isDeleted)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newItems = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      file
    }))
    setGallery((prev) => [...prev, ...newItems])
  }

  function removePreview(url: string) {
    const index = gallery.findIndex(item => item.url === url)
    if (index === -1) return

    const updated = [...gallery]
    const itemToRemove = updated[index]
    
    // Marcar como eliminada
    updated[index] = { ...itemToRemove, isDeleted: true }
    setGallery(updated)

    // Mostrar toast con opción Deshacer (Undo)
    toast('Imagen quitada del disfraz', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          const restored = [...updated]
          restored[index] = { ...itemToRemove, isDeleted: false }
          setGallery(restored)
        }
      }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Capturar el FormData sincronamente ANTES de que startTransition deshabilite los inputs
    const submissionData = new FormData(e.currentTarget)

    if (visibleImages.length === 0) {
      toast.error('Debes añadir al menos una imagen para el disfraz')
      return
    }

    startTransition(async () => {
      // 1. Subir nuevos archivos locales a R2 en paralelo
      const newItems = gallery.filter(item => item.file && !item.isDeleted)
      const uploadedList: { url: string; key: string }[] = []
      const uploadedKeys: string[] = []

      // Obtener el ID del disfraz (existente o generado para la ruta en R2)
      const costumeId = costume?.id || crypto.randomUUID()

      const uploadPromises = newItems.map(async (item) => {
        const uniqueId = crypto.randomUUID()
        const customKey = `${categoryId}/${costumeId}/${uniqueId}.webp`

        const formData = new FormData()
        formData.append('file', item.file!)
        formData.append('key', customKey)

        const res = await uploadImageAction(formData)
        if (res.success && res.url && res.key) {
          return { url: res.url, key: res.key }
        } else {
          throw new Error(res.error || 'Error al subir una de las imágenes')
        }
      })

      try {
        const results = await Promise.all(uploadPromises)
        for (const r of results) {
          uploadedList.push(r)
          uploadedKeys.push(r.key)
        }
      } catch (err: any) {
        // Limpieza de emergencia de las imágenes subidas si alguna falla
        for (const key of uploadedKeys) {
          await deleteImageAction(key)
        }
        toast.error(err.message || 'Error al subir las imágenes a R2')
        return
      }

      // 2. Eliminar de R2 los archivos que fueron borrados (solo existentes de BD)
      const deletedItems = gallery.filter(item => item.isDeleted && item.key)
      for (const item of deletedItems) {
        await deleteImageAction(item.key!)
      }

      // 3. Crear lista final de imágenes
      const finalImages = [
        ...gallery.filter(item => item.key && !item.isDeleted).map(item => ({
          id: item.id,
          url: item.url,
          key: item.key!
        })),
        ...uploadedList
      ]

      // 4. Agregar campos adicionales al FormData pre-capturado
      submissionData.set('id', costumeId)
      submissionData.set('categoryId', categoryId)
      submissionData.set('audience', audience)
      submissionData.set('published', String(published))
      submissionData.set('featured', String(featured))
      submissionData.set('images', JSON.stringify(finalImages))

      // 5. Enviar a la Server Action correspondiente
      const res = costume
        ? await updateCostumeAction(submissionData)
        : await createCostumeAction(submissionData)

      if (res.success) {
        toast.success(costume ? 'Disfraz actualizado exitosamente' : 'Disfraz creado exitosamente')
        router.push('/admin')
        router.refresh()
      } else {
        // Si falló el guardado en base de datos, limpiamos las subidas nuevas para evitar archivos huérfanos
        for (const key of uploadedKeys) {
          await deleteImageAction(key)
        }
        toast.error(res.error || 'Error al guardar los datos del disfraz')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Col 1-2: campos principales */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Details card */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Detalles</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre del disfraz</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={costume?.name}
                  placeholder="Ej. Hada Encantada"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category-select">Categoría</Label>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    disabled={isPending}
                    items={categories.map((c) => ({ label: c.name, value: c.id }))}
                  >
                    <SelectTrigger id="category-select" className="w-full">
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="audience-select">Público</Label>
                  <Select
                    value={audience}
                    onValueChange={setAudience}
                    disabled={isPending}
                    items={[
                      { label: 'Niños', value: 'KIDS' },
                      { label: 'Adultos', value: 'ADULTS' },
                      { label: 'Todo público', value: 'ALL' },
                    ]}
                  >
                    <SelectTrigger id="audience-select" className="w-full">
                      <SelectValue placeholder="Público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KIDS">Niños</SelectItem>
                      <SelectItem value="ADULTS">Adultos</SelectItem>
                      <SelectItem value="ALL">Todo público</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="shortDescription">Descripción corta</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={costume?.shortDescription}
                  placeholder="Un resumen de una línea mostrado en las tarjetas"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descripción completa</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  defaultValue={costume?.description}
                  placeholder="Describe los materiales, detalles y confección…"
                  required
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Prices and tags */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Precios y etiquetas</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Rango de precios</Label>
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-border bg-background px-2.5 h-10 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
                    <span className="shrink-0 text-xs text-muted-foreground">$ mín.</span>
                    <input
                      name="priceMin"
                      type="number"
                      min="0"
                      step="1"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="120"
                      required
                      disabled={isPending}
                      aria-label="Precio mínimo en USD"
                      className="min-w-0 w-full flex-1 bg-transparent text-sm outline-none tabular-nums placeholder:text-muted-foreground"
                    />
                  </div>
                  <span className="shrink-0 text-muted-foreground text-sm">—</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-border bg-background px-2.5 h-10 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
                    <span className="shrink-0 text-xs text-muted-foreground">$ máx.</span>
                    <input
                      name="priceMax"
                      type="number"
                      min="0"
                      step="1"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="180"
                      required
                      disabled={isPending}
                      aria-label="Precio máximo en USD"
                      className="min-w-0 w-full flex-1 bg-transparent text-sm outline-none tabular-nums placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">El símbolo $ USD ya está incluido.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="estimatedTime">Tiempo estimado de confección</Label>
                <Input
                  id="estimatedTime"
                  name="estimatedTime"
                  defaultValue={costume?.creationTime}
                  placeholder="2 – 3 semanas"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={costume?.tags.join(', ')}
                  placeholder="tul, alas, hecho a mano"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">Separa las etiquetas con comas.</p>
              </div>
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Visibilidad</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {published ? (
                      <Eye className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    ) : (
                      <EyeOff className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium">
                      {published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {published
                      ? 'Visible en el catálogo público.'
                      : 'Solo visible en el panel de administración.'}
                  </p>
                </div>
                <Switch
                  checked={published}
                  onCheckedChange={setPublished}
                  disabled={isPending}
                  aria-label="Alternar visibilidad del disfraz"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Star
                      className={`size-4 shrink-0 ${featured ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">
                      {featured ? 'Destacado' : 'No destacado'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {featured
                      ? 'Aparece en la sección de destacados del inicio.'
                      : 'No aparece como destacado en el inicio.'}
                  </p>
                </div>
                <Switch
                  checked={featured}
                  onCheckedChange={setFeatured}
                  disabled={isPending}
                  aria-label="Alternar si el disfraz es destacado"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: subir imágenes y acciones */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Imágenes</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              aria-label="Subir imágenes"
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Subir imágenes</span>
              <span className="text-xs text-muted-foreground">
                PNG o JPG, arrastra o haz clic para buscar
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label="Input de subir imágenes oculto"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={isPending}
            />

            {visibleImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {visibleImages.map((img, i) => (
                  <div
                    key={`${img.url}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url || '/placeholder.svg'}
                      alt={`Imagen subida ${i + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(img.url)}
                      disabled={isPending}
                      aria-label={`Eliminar imagen ${i + 1}`}
                      className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Guardando...
                </>
              ) : costume ? (
                'Guardar cambios'
              ) : (
                'Crear disfraz'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-full"
              disabled={isPending}
              onClick={() => router.push('/admin')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
