import { Suspense } from "react"
import EnhancedFormsList from "@/components/forms-builder/enhanced-forms-list"
import { Skeleton } from "@/components/ui/skeleton"
import RouteGuard from "@/components/route-guard"

function FormsListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mb-6">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  )
}

export default function FormsPage() {
  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <Suspense fallback={<FormsListSkeleton />}>
        <EnhancedFormsList />
      </Suspense>
    </RouteGuard>
  )
}
