import { Suspense } from 'react'
import { Shell } from '@/components/layout/Shell'
import { HomeFeed } from '@/components/browse/HomeFeed'
import { SkeletonHero, SkeletonRail } from '@/components/feedback/Skeletons'

export default function BrowsePage() {
  return (
    <Shell>
      <Suspense fallback={<><SkeletonHero /><SkeletonRail /><SkeletonRail /></>}>
        <HomeFeed />
      </Suspense>
    </Shell>
  )
}
