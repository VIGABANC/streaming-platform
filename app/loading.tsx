import { SkeletonHero, SkeletonRail } from '@/components/feedback/Skeletons'

export default function Loading() {
  return (
    <>
      <SkeletonHero />
      <div className="mt-8 space-y-8">
        <SkeletonRail />
        <SkeletonRail />
      </div>
    </>
  )
}
