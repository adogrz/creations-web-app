import { AdminForm } from "@/components/admin/admin-form"

export default function NewCostumePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Nuevo disfraz</h1>
        <p className="mt-1 text-muted-foreground">Añade una nueva creación a tu catálogo.</p>
      </div>
      <AdminForm />
    </div>
  )
}
