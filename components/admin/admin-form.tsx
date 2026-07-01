'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { UploadCloud, X, Check, Star, Eye, EyeOff } from 'lucide-react'
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
import { categories, type Costume } from '@/lib/data'

type AdminFormProps = {
  costume?: Costume
}

const audiences = ['Kids', 'Adults', 'All ages']

/** Parse "$120 – $180" into [120, 180] */
function parsePriceRange(range?: string): [string, string] {
  if (!range) return ['', '']
  const numbers = range.match(/[\d.]+/g)
  if (!numbers || numbers.length < 2) return [numbers?.[0] ?? '', '']
  return [numbers[0], numbers[1]]
}

export function AdminForm({ costume }: AdminFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(costume?.categorySlug ?? '')
  const [audience, setAudience] = useState(costume?.audience ?? '')
  const [previews, setPreviews] = useState<string[]>(costume?.images ?? [])
  const [saved, setSaved] = useState(false)
  const [featured, setFeatured] = useState(costume?.featured ?? false)
  const [published, setPublished] = useState(costume?.published ?? true)

  const [priceMin, setPriceMin] = useState(() => parsePriceRange(costume?.priceRange)[0])
  const [priceMax, setPriceMax] = useState(() => parsePriceRange(costume?.priceRange)[1])

  function handleFiles(files: FileList | null) {
    if (!files) return
    const urls = Array.from(files).map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...urls])
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Mock save — no backend yet.
    setSaved(true)
    setTimeout(() => router.push('/admin'), 900)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main fields */}
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
                />
              </div>

              {/* Selects — single column on mobile, 2 cols on sm+ */}
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category-select">Categoría</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger id="category-select" className="w-full">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="audience-select">Público</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v)}>
                    <SelectTrigger id="audience-select" className="w-full">
                      <SelectValue placeholder="Seleccionar público" />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a === 'Kids' ? 'Niños' : a === 'Adults' ? 'Adultos' : 'Todo público'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="short">Descripción corta</Label>
                <Input
                  id="short"
                  name="short"
                  defaultValue={costume?.shortDescription}
                  placeholder="Un resumen de una línea mostrado en las tarjetas"
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
                />
              </div>
            </div>
          </div>

          {/* Prices and tags */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Precios y etiquetas</h2>
            <div className="flex flex-col gap-4">

              {/* Price range — two number fields */}
              <div className="flex flex-col gap-2">
                <Label>Rango de precios</Label>
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-background px-3 h-10 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
                    <span className="shrink-0 text-sm text-muted-foreground">$ mín.</span>
                    <input
                      name="priceMin"
                      type="number"
                      min="0"
                      step="1"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="120"
                      aria-label="Precio mínimo en USD"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none tabular-nums placeholder:text-muted-foreground"
                    />
                  </div>
                  <span className="shrink-0 text-muted-foreground">—</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-background px-3 h-10 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
                    <span className="shrink-0 text-sm text-muted-foreground">$ máx.</span>
                    <input
                      name="priceMax"
                      type="number"
                      min="0"
                      step="1"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="180"
                      aria-label="Precio máximo en USD"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none tabular-nums placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">El símbolo $ USD ya está incluido.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Tiempo estimado de confección</Label>
                <Input
                  id="time"
                  name="time"
                  defaultValue={costume?.creationTime}
                  placeholder="2 – 3 semanas"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={costume?.tags.join(', ')}
                  placeholder="tul, alas, hecho a mano"
                />
                <p className="text-xs text-muted-foreground">Separa las etiquetas con comas.</p>
              </div>
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Visibilidad</h2>
            <div className="flex flex-col gap-4">

              {/* Published toggle */}
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
                  aria-label="Alternar visibilidad del disfraz"
                />
              </div>

              {/* Featured toggle */}
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
                  aria-label="Alternar si el disfraz es destacado"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Image upload + actions */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <h2 className="mb-4 font-heading text-lg font-medium">Imágenes</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Subir imágenes"
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
            />

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src || '/placeholder.svg'}
                      alt={`Imagen subida ${i + 1}`}
                      className="size-full object-cover"
                    />
                    {/* Always visible on mobile; hover-reveal on desktop */}
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
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

          <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
            <Button type="submit" size="lg" className="w-full rounded-full">
              {saved ? (
                <>
                  <Check /> Guardado
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
              onClick={() => router.push('/admin')}
            >
              Cancelar
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Este es un formulario de demostración — los cambios no se guardan aún.
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}
