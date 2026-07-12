'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil,
  Trash2,
  PlusCircle,
  Check,
  X,
  FolderOpen,
  Loader2,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { validateImageFile } from '@/lib/image-upload-validation'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/admin/actions/category-actions'
import { uploadImageAction } from '@/app/admin/actions/upload-actions'
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

type CategoryItem = {
  id: string
  updatedAt: string
  name: string
  slug: string
  description: string
  image: string
  imageKey: string
  costumeCount: number
}

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryItem[]
}) {
  const router = useRouter()
  const [list, setList] = useState<CategoryItem[]>(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // Archivo local y URL de vista previa; fallos de envío pueden dejar objetos huérfanos.
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setList(initialCategories)
  }, [initialCategories])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      e.target.value = ''
      toast.error(validationError)
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setImageRemoved(false)
  }

  function removeImage() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setImageRemoved(true)
  }

  function startEdit(cat: CategoryItem) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description)
    setPreviewUrl(cat.image)
    setSelectedFile(null)
    setImageRemoved(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setImageRemoved(false)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      let finalImageUrl = ''
      let finalImageKey = ''

      // Si seleccionó una nueva foto local, la subimos a R2
      if (selectedFile) {
        const uploadData = new FormData()
        uploadData.append('file', selectedFile)

        const uploadRes = await uploadImageAction(uploadData)
        if (!uploadRes.success || !uploadRes.url || !uploadRes.key) {
          toast.error(uploadRes.error || 'Error al subir la nueva imagen')
          return
        }
        finalImageUrl = uploadRes.url
        finalImageKey = uploadRes.key
      }

      const formData = new FormData()
      const category = list.find((item) => item.id === id)
      if (!category) return
      formData.append('updatedAt', category.updatedAt)
      formData.append('name', editName.trim())
      formData.append('description', editDescription.trim())
      formData.append(
        'image',
        imageRemoved ? '' : finalImageUrl || category.image,
      )
      formData.append(
        'imageKey',
        imageRemoved ? '' : finalImageKey || category.imageKey,
      )

      try {
        const res = await updateCategoryAction(id, formData)
        if (res.success) {
          toast.success('Categoría actualizada')
          cancelEdit()
          router.refresh()
          return
        }
        toast.error(res.error || 'Error al actualizar categoría')
      } catch {
        toast.error('No se pudo actualizar la categoría. Inténtalo de nuevo.')
      }
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteCategoryAction(id)
      if (res.success) {
        toast.success('Categoría eliminada')
        router.refresh()
      } else {
        toast.error(res.error || 'Error al eliminar categoría')
      }
    })
  }

  async function saveNew() {
    if (!newName.trim()) return
    if (!selectedFile) {
      toast.error('Por favor, selecciona una imagen para la categoría')
      return
    }

    startTransition(async () => {
      const catId = crypto.randomUUID()
      // 1. Subir la imagen a R2 antes de crear el registro
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)

      const uploadRes = await uploadImageAction(uploadData)
      if (!uploadRes.success || !uploadRes.url || !uploadRes.key) {
        toast.error(uploadRes.error || 'Error al subir la imagen a la nube')
        return
      }

      // 2. Crear la categoría en la BD
      const formData = new FormData()
      formData.append('id', catId)
      formData.append('name', newName.trim())
      formData.append('description', newDescription.trim())
      formData.append('image', uploadRes.url)
      formData.append('imageKey', uploadRes.key)

      try {
        const res = await createCategoryAction(formData)
        if (res.success) {
          toast.success('Categoría creada exitosamente')
          setAdding(false)
          setNewName('')
          setNewDescription('')
          setSelectedFile(null)
          setPreviewUrl(null)
          router.refresh()
          return
        }
        toast.error(res.error || 'Error al crear la categoría')
      } catch {
        toast.error('No se pudo crear la categoría. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add new category */}
      {adding ? (
        <div className="bg-card ring-foreground/5 rounded-2xl p-5 shadow-xs ring-1">
          <h3 className="font-heading mb-4 text-base font-medium">
            Nueva categoría
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-cat-name">Nombre</Label>
              <Input
                id="new-cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Cuentos de Hadas"
                autoFocus
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-cat-desc">Descripción</Label>
              <Input
                id="new-cat-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Breve descripción de la categoría"
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Imagen de Portada</Label>
              {!previewUrl ? (
                <>
                  <label
                    htmlFor="new-cat-file"
                    className="border-border hover:border-primary/50 hover:bg-muted/50 focus-within:ring-ring flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:outline-none"
                  >
                    <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
                      <UploadCloud className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium">Subir imagen</span>
                    <span className="text-muted-foreground text-xs">
                      PNG o JPG, máximo 9 MB
                    </span>
                  </label>
                  <input
                    id="new-cat-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isPending}
                  />
                </>
              ) : (
                <div className="bg-muted ring-foreground/10 relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-xl ring-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Portada previsualización"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isPending}
                    className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-1 right-1 flex size-7 items-center justify-center rounded-full shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={saveNew}
                disabled={!newName.trim() || isPending}
                className="rounded-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                Crear categoría
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                disabled={isPending}
                onClick={() => {
                  setAdding(false)
                  setNewName('')
                  setNewDescription('')
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full"
            disabled={isPending}
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Nueva categoría
          </Button>
        </div>
      )}

      {/* Category list */}
      <div className="flex flex-col gap-2.5">
        {list.map((cat) => {
          const count = cat.costumeCount
          const isEditing = editingId === cat.id

          return (
            <div
              key={cat.id}
              className="bg-card ring-foreground/5 rounded-2xl p-4 shadow-xs ring-1"
            >
              {isEditing ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`edit-name-${cat.id}`}>Nombre</Label>
                    <Input
                      id={`edit-name-${cat.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`edit-desc-${cat.id}`}>Descripción</Label>
                    <Input
                      id={`edit-desc-${cat.id}`}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Cambiar Imagen de Portada</Label>
                    {!previewUrl ? (
                      <>
                        <label
                          htmlFor={`edit-file-${cat.id}`}
                          className="border-border hover:border-primary/50 hover:bg-muted/50 focus-within:ring-ring flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:outline-none"
                        >
                          <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
                            <UploadCloud
                              className="size-5"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="text-sm font-medium">
                            Subir nueva imagen
                          </span>
                          <span className="text-muted-foreground text-xs">
                            PNG o JPG, máximo 9 MB
                          </span>
                        </label>
                        <input
                          id={`edit-file-${cat.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isPending}
                        />
                      </>
                    ) : (
                      <div className="bg-muted ring-foreground/10 relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-xl ring-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Portada de la categoría"
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          disabled={isPending}
                          className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-1 right-1 flex size-7 items-center justify-center rounded-full shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveEdit(cat.id)}
                      disabled={!editName.trim() || isPending}
                      className="rounded-full"
                    >
                      {isPending ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" aria-hidden="true" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      disabled={isPending}
                      onClick={cancelEdit}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FolderOpen className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {cat.description}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {count} {count === 1 ? 'disfraz' : 'disfraces'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      size="default"
                      variant="outline"
                      className="size-9 justify-center rounded-full p-0"
                      onClick={() => startEdit(cat)}
                      disabled={isPending}
                      aria-label={`Editar categoría ${cat.name}`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            type="button"
                            size="default"
                            variant="destructive"
                            className={cn(
                              'size-9 justify-center rounded-full p-0',
                              count > 0 && 'cursor-not-allowed opacity-40',
                            )}
                            aria-label={`Eliminar categoría ${cat.name}`}
                            disabled={count > 0 || isPending}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar categoría?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto eliminará la categoría &ldquo;{cat.name}
                            &rdquo;. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              startTransition(() => handleDelete(cat.id))
                            }
                            variant="destructive"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {list.length === 0 && (
        <div className="bg-card ring-foreground/5 flex flex-col items-center gap-2 rounded-2xl py-12 text-center shadow-xs ring-1">
          <p className="font-heading text-lg font-medium">Sin categorías</p>
          <p className="text-muted-foreground text-sm">
            Añade una categoría para empezar a organizar tu catálogo.
          </p>
        </div>
      )}
    </div>
  )
}
