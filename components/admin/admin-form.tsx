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
import {
  createCostumeAction,
  updateCostumeAction,
} from '@/app/admin/actions/costume-actions'
import { toast } from 'sonner'
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_HELP_TEXT,
  validateImageFile,
} from '@/lib/image-upload-validation'
import { uploadImage } from '@/lib/upload-image-client'

type UploadedImage = { url: string; key: string }

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
  updatedAt: string
  name: string
  slug: string
  categoryId: string
  categorySlug: string
  audience: string
  description: string | null
  price: number
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
    costume?.audience === 'Kids'
      ? 'KIDS'
      : costume?.audience === 'Adults'
        ? 'ADULTS'
        : 'ALL',
  )
  const [published, setPublished] = useState(costume?.published ?? true)
  const [featured, setFeatured] = useState(costume?.featured ?? false)

  const [price, setPrice] = useState(
    costume?.price ? String(costume.price) : '',
  )

  const [isPending, startTransition] = useTransition()

  // Galería unificada para manejar imágenes de base de datos y archivos locales pendientes
  const [gallery, setGallery] = useState<GalleryItem[]>(
    () =>
      costume?.images.map((img) => ({
        id: img.id,
        url: img.url,
        key: img.key,
      })) ?? [],
  )

  // Sincronizar galería si cambia el disfraz
  useEffect(() => {
    if (costume) {
      setGallery(
        costume.images.map((img) => ({
          id: img.id,
          url: img.url,
          key: img.key,
        })),
      )
    }
  }, [costume])

  // Mostrar solo las imágenes que no han sido marcadas para borrar
  const visibleImages = gallery.filter((item) => !item.isDeleted)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const acceptedFiles = Array.from(files).filter((file) => {
      const validationError = validateImageFile(file)
      if (validationError) toast.error(`${file.name}: ${validationError}`)
      return !validationError
    })
    const newItems = acceptedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }))
    setGallery((prev) => [...prev, ...newItems])
  }

  function removePreview(url: string) {
    const index = gallery.findIndex(
      (item) => item.url === url && !item.isDeleted,
    )
    if (index === -1) return

    const updated = [...gallery]
    const itemToRemove = updated[index]
    const itemIdentity = itemToRemove.id ?? itemToRemove.key ?? itemToRemove.url

    // Marcar como eliminada
    updated[index] = { ...itemToRemove, isDeleted: true }
    setGallery(updated)

    // Mostrar toast con opción Deshacer (Undo)
    toast('Imagen quitada del disfraz', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          setGallery((current) =>
            current.map((item) =>
              (item.id ?? item.key ?? item.url) === itemIdentity
                ? { ...item, isDeleted: false }
                : item,
            ),
          )
        },
      },
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
      const newItems = gallery.filter((item) => item.file && !item.isDeleted)
      let uploadedList: UploadedImage[] = []
      // Obtener el ID del disfraz (existente o generado para la ruta en R2)
      const costumeId = costume?.id || crypto.randomUUID()

      const uploadPromises = newItems.map(async (item) => {
        const formData = new FormData()
        formData.append('file', item.file!)

        const res = await uploadImage(formData)
        if (res.success && res.url && res.key) {
          return { url: res.url, key: res.key }
        } else {
          throw new Error(res.error || 'Error al subir una de las imágenes')
        }
      })

      const results = await Promise.allSettled(uploadPromises)
      uploadedList = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      const failedUpload = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )
      if (failedUpload) {
        toast.error(
          failedUpload.reason?.message || 'Error al subir las imágenes a R2',
        )
        return
      }

      // 2. Build the final image list.
      const finalImages = [
        ...gallery
          .filter((item) => item.key && !item.isDeleted)
          .map((item) => ({
            id: item.id,
            url: item.url,
            key: item.key!,
          })),
        ...uploadedList,
      ]

      // 3. Add fields to the FormData captured before the transition.
      submissionData.set('id', costumeId)
      if (costume) submissionData.set('updatedAt', costume.updatedAt)
      submissionData.set('categoryId', categoryId)
      submissionData.set('audience', audience)
      submissionData.set('published', String(published))
      submissionData.set('featured', String(featured))
      submissionData.set('images', JSON.stringify(finalImages))

      // 4. Submit to the matching Server Action.
      try {
        const res = costume
          ? await updateCostumeAction(submissionData)
          : await createCostumeAction(submissionData)

        if ('success' in res && res.success) {
          toast.success(
            costume
              ? 'Disfraz actualizado exitosamente'
              : 'Disfraz creado exitosamente',
          )
          router.push('/admin')
          router.refresh()
        } else {
          toast.error(
            ('error' in res && res.error) ||
              'Error al guardar los datos del disfraz',
          )
        }
      } catch {
        toast.error('No se pudo guardar el disfraz. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Col 1-2: campos principales */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Details card */}
          <div className="bg-card ring-foreground/5 rounded-2xl p-5 shadow-xs ring-1">
            <h2 className="font-heading mb-4 text-lg font-medium">Detalles</h2>
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
                    onValueChange={(val) => setCategoryId(val || '')}
                    disabled={isPending}
                    items={categories.map((c) => ({
                      label: c.name,
                      value: c.id,
                    }))}
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
                    onValueChange={(val) => setAudience(val || 'ALL')}
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
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  defaultValue={costume?.description ?? ''}
                  placeholder="Describe los materiales, detalles y confección (opcional)…"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Prices and tags */}
          <div className="bg-card ring-foreground/5 rounded-2xl p-5 shadow-xs ring-1">
            <h2 className="font-heading mb-4 text-lg font-medium">
              Precios y etiquetas
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Precio base ($)</Label>
                <div className="border-border bg-background focus-within:ring-ring flex h-10 min-w-0 items-center gap-1 rounded-lg border px-2.5 transition-all focus-within:border-transparent focus-within:ring-2">
                  <span className="text-muted-foreground shrink-0 text-xs">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="120"
                    required
                    disabled={isPending}
                    aria-label="Precio base en USD"
                    className="placeholder:text-muted-foreground w-full min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  El precio mínimo o de referencia ("Desde $X"). El símbolo $
                  USD ya está incluido.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="estimatedTime">
                  Tiempo estimado de confección
                </Label>
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
                <p className="text-muted-foreground text-xs">
                  Separa las etiquetas con comas.
                </p>
              </div>
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="bg-card ring-foreground/5 rounded-2xl p-5 shadow-xs ring-1">
            <h2 className="font-heading mb-4 text-lg font-medium">
              Visibilidad
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {published ? (
                      <Eye
                        className="text-primary size-4 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <EyeOff
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
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
                  <p className="text-muted-foreground text-xs">
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
          <div className="bg-card ring-foreground/5 rounded-2xl p-5 shadow-xs ring-1">
            <h2 className="font-heading mb-4 text-lg font-medium">Imágenes</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              aria-label="Subir imágenes"
              className="border-border hover:border-primary/50 hover:bg-muted/50 focus-visible:ring-ring flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
                <UploadCloud className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Subir imágenes</span>
              <span className="text-muted-foreground text-xs">
                {IMAGE_UPLOAD_HELP_TEXT}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT}
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
                    className="group bg-muted ring-foreground/10 relative aspect-square overflow-hidden rounded-xl ring-1"
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
                      className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-1 right-1 flex size-7 items-center justify-center rounded-full shadow-sm transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-card ring-foreground/5 flex flex-col gap-3 rounded-2xl p-5 shadow-xs ring-1">
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Guardando...
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
