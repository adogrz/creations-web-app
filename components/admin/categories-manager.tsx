'use client'

import { useState } from 'react'
import { Pencil, Trash2, PlusCircle, Check, X, FolderOpen } from 'lucide-react'
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
import { categories as initialCategories, costumes, type Category } from '@/lib/data'
import { cn } from '@/lib/utils'

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

export function CategoriesManager() {
  const [list, setList] = useState<Category[]>(initialCategories)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  function costumeCount(slug: string) {
    return costumes.filter((c) => c.categorySlug === slug).length
  }

  function startEdit(cat: Category) {
    setEditingSlug(cat.slug)
    setEditName(cat.name)
    setEditDescription(cat.description)
  }

  function cancelEdit() {
    setEditingSlug(null)
    setEditName('')
    setEditDescription('')
  }

  function saveEdit() {
    if (!editName.trim()) return
    setList((prev) =>
      prev.map((c) =>
        c.slug === editingSlug
          ? { ...c, name: editName.trim(), description: editDescription.trim() }
          : c,
      ),
    )
    cancelEdit()
  }

  function handleDelete(slug: string) {
    setList((prev) => prev.filter((c) => c.slug !== slug))
  }

  function saveNew() {
    if (!newName.trim()) return
    const slug = slugify(newName)
    if (list.some((c) => c.slug === slug)) return // duplicate guard
    setList((prev) => [
      ...prev,
      {
        slug,
        name: newName.trim(),
        description: newDescription.trim(),
        image: '/images/costume-fairy.png',
      },
    ])
    setNewName('')
    setNewDescription('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add new category */}
      {adding ? (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
          <h3 className="mb-4 font-heading text-base font-medium">Nueva categoría</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-cat-name">Nombre</Label>
              <Input
                id="new-cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Superhéroes"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-cat-desc">Descripción</Label>
              <Input
                id="new-cat-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Breve descripción de la categoría"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={saveNew}
                disabled={!newName.trim()}
                className="rounded-full"
              >
                <Check className="size-4" aria-hidden="true" />
                Crear categoría
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setAdding(false)
                  setNewName('')
                  setNewDescription('')
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
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Nueva categoría
          </Button>
        </div>
      )}

      {/* Category list */}
      <div className="flex flex-col gap-2.5">
        {list.map((cat) => {
          const count = costumeCount(cat.slug)
          const isEditing = editingSlug === cat.slug

          return (
            <div
              key={cat.slug}
              className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5 shadow-xs"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`edit-name-${cat.slug}`}>Nombre</Label>
                    <Input
                      id={`edit-name-${cat.slug}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`edit-desc-${cat.slug}`}>Descripción</Label>
                    <Input
                      id={`edit-desc-${cat.slug}`}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveEdit}
                      disabled={!editName.trim()}
                      className="rounded-full"
                    >
                      <Check className="size-3.5" aria-hidden="true" />
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={cancelEdit}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{cat.name}</p>
                    {cat.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {count} {count === 1 ? 'disfraz' : 'disfraces'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      size="default"
                      variant="outline"
                      className="rounded-full size-9 justify-center p-0"
                      onClick={() => startEdit(cat)}
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
                              'rounded-full size-9 justify-center p-0',
                              count > 0 && 'opacity-40 cursor-not-allowed',
                            )}
                            aria-label={`Eliminar categoría ${cat.name}`}
                            disabled={count > 0}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto eliminará la categoría &ldquo;{cat.name}&rdquo;. Esta acción no se
                            puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cat.slug)}
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
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card py-12 text-center ring-1 ring-foreground/5 shadow-xs">
          <p className="font-heading text-lg font-medium">Sin categorías</p>
          <p className="text-sm text-muted-foreground">
            Añade una categoría para empezar a organizar tu catálogo.
          </p>
        </div>
      )}
    </div>
  )
}
