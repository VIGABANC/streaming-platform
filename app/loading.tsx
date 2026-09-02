import { Shell } from '@/components/layout/Shell'
import { SkeletonHero, SkeletonRail } from '@/components/feedback/Skeletons'

export default function Loading() {
  return (
    <Shell>
      <SkeletonHero />
      <div className="mt-8 space-y-8">
        <SkeletonRail />
        <SkeletonRail />
      </div>
    </Shell>
  )
}
