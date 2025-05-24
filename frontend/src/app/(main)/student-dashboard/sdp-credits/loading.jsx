import { Card, CardContent, CardFooter, CardHeader } from "@/components/dashboard/student/ui/card"
import { Skeleton } from "@/components/dashboard/student/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs"

export default function Loading() {
  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="balance">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="balance" disabled>
              Balance
            </TabsTrigger>
            <TabsTrigger value="topup" disabled>
              Top Up
            </TabsTrigger>
            <TabsTrigger value="history" disabled>
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-4 w-[180px]" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
                      <Skeleton className="h-10 w-[100px] mx-auto" />
                      <Skeleton className="h-4 w-[150px] mx-auto mt-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-10 w-[120px]" />
                  <Skeleton className="h-10 w-[120px]" />
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
