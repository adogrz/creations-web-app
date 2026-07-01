import { notFound } from "next/navigation"
import { AdminForm } from "@/components/admin/admin-form"
import { getCostumeBySlug } from "@/lib/data"

export default async function EditCostumePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const costume = getCostumeBySlug(slug)

  if (!costume) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Editar disfraz</h1>
        <p className="mt-1 text-muted-foreground">
          Actualiza los detalles de {costume.name}.
        </p>
      </div>
      <AdminForm costume={costume} />
    </div>
  )
}
