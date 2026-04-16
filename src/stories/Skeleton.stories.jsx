import { Skeleton, SkeletonCard, SkeletonTable, SkeletonKPI } from '../components/ui/skeleton'

export default {
  title: 'UI/Skeleton',
  tags: ['autodocs'],
}

export const Default = {
  render: () => (
    <div className="space-y-2 w-64">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
}

export const CardSkeleton = {
  render: () => (
    <div className="w-72">
      <SkeletonCard />
    </div>
  ),
}

export const TableSkeleton = {
  render: () => (
    <div className="w-full">
      <SkeletonTable rows={5} />
    </div>
  ),
}

export const KPISkeleton = {
  render: () => <SkeletonKPI />,
}
