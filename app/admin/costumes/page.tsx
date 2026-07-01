import { AdminTable } from '@/components/admin/admin-table'

export default function AdminCostumesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Costumes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View, edit and remove costumes from your catalog.
        </p>
      </div>
      <AdminTable />
    </div>
  )
}
