// frontend/src/app/admin-dashboard/events/loading.jsx

import { Card, CardContent } from "@/components/dashboard/admin/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="zoom-perfect-layout min-h-screen zoom-safe" style={{
      padding: `clamp(1rem, 3vw, 2.5rem)`,
      gap: `clamp(1rem, 2.5vw, 2rem)`,
      background: '#f8f9fa'
    }}>
      {/* Header Skeleton */}
      <div className="zoom-safe" style={{
        marginBottom: `clamp(1.5rem, 3vw, 2.5rem)`
      }}>
        <Skeleton style={{
          height: `clamp(2rem, 4vw, 2.5rem)`,
          width: `clamp(200px, 40vw, 300px)`,
          marginBottom: `clamp(0.5rem, 1vw, 0.75rem)`
        }} />
        <Skeleton style={{
          height: `clamp(1rem, 2vw, 1.25rem)`,
          width: `clamp(300px, 60vw, 450px)`
        }} />
      </div>

      {/* Event Management Card Skeleton */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe">
        <CardContent style={{ padding: `clamp(1.25rem, 3vw, 1.5rem)` }}>
          <div className="responsive-flex-between gap-fluid">
            <div className="zoom-safe">
              <Skeleton style={{
                height: `clamp(1.5rem, 3vw, 2rem)`,
                width: `clamp(150px, 30vw, 200px)`,
                marginBottom: `clamp(0.5rem, 1vw, 0.75rem)`
              }} />
              <Skeleton style={{
                height: `clamp(1rem, 2vw, 1.25rem)`,
                width: `clamp(250px, 50vw, 350px)`
              }} />
            </div>
            <div className="flex" style={{
              gap: `clamp(0.5rem, 1vw, 0.75rem)`
            }}>
              <Skeleton style={{
                height: `clamp(2.25rem, 4.5vw, 2.5rem)`,
                width: `clamp(100px, 20vw, 130px)`
              }} />
              <Skeleton style={{
                height: `clamp(2.25rem, 4.5vw, 2.5rem)`,
                width: `clamp(80px, 16vw, 100px)`
              }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls Card Skeleton */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe">
        <CardContent style={{ padding: `clamp(1.25rem, 3vw, 1.5rem)` }}>
          <div className="space-y-4 zoom-safe">
            {/* Tabs Skeleton */}
            <div className="flex" style={{
              gap: `clamp(0.5rem, 1vw, 0.75rem)`
            }}>
              <Skeleton style={{
                height: `clamp(2.5rem, 5vw, 3rem)`,
                width: `clamp(100px, 20vw, 120px)`
              }} />
              <Skeleton style={{
                height: `clamp(2.5rem, 5vw, 3rem)`,
                width: `clamp(80px, 16vw, 100px)`
              }} />
              <Skeleton style={{
                height: `clamp(2.5rem, 5vw, 3rem)`,
                width: `clamp(100px, 20vw, 120px)`
              }} />
            </div>

            {/* Search and Filter Skeleton */}
            <div className="responsive-flex gap-fluid">
              <Skeleton style={{
                height: `clamp(2.5rem, 5vw, 2.75rem)`,
                width: '100%',
                maxWidth: `clamp(200px, 30vw, 320px)`
              }} />
              <div className="flex" style={{
                gap: `clamp(0.5rem, 1vw, 0.75rem)`
              }}>
                <Skeleton style={{
                  height: `clamp(2.5rem, 5vw, 2.75rem)`,
                  width: `clamp(130px, 20vw, 160px)`
                }} />
                <Skeleton style={{
                  height: `clamp(2.5rem, 5vw, 2.75rem)`,
                  width: `clamp(2.5rem, 5vw, 2.75rem)`
                }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Skeleton */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe flex-1">
        <CardContent style={{
          padding: `clamp(1.25rem, 3vw, 1.5rem)`,
          minHeight: `clamp(400px, 50vh, 600px)`
        }}>
          <div className="zoom-safe h-full">
            {/* Calendar/List View Skeleton */}
            <div className="grid gap-4" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, clamp(250px, 25vw, 300px)), 1fr))',
              gap: `clamp(1rem, 2vw, 1.5rem)`
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  style={{
                    height: `clamp(150px, 20vw, 200px)`,
                    width: '100%'
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
