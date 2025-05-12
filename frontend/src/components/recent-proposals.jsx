"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export function RecentProposals() {
  // In a real app, this data would come from an API
  const proposals = [
    {
      id: "PROP-1001",
      title: "Community Outreach Program",
      submitter: {
        name: "Health Department",
        avatar: "/abstract-hd.png",
        initials: "HD",
      },
      category: "Health",
      status: "pending",
      date: "2023-05-15",
    },
    {
      id: "PROP-1002",
      title: "HIV Awareness Campaign",
      submitter: {
        name: "XU Medical Center",
        avatar: "/abstract-geometric-xu.png",
        initials: "XU",
      },
      category: "Health",
      status: "approved",
      date: "2023-05-12",
    },
    {
      id: "PROP-1003",
      title: "Tech Skills Workshop",
      submitter: {
        name: "Lourdes College",
        avatar: "/abstract-lc.png",
        initials: "LC",
      },
      category: "Education",
      status: "rejected",
      date: "2023-05-10",
    },
    {
      id: "PROP-1004",
      title: "Small Business Development Program",
      submitter: {
        name: "Economic Development Office",
        avatar: "/abstract-geometric-ed.png",
        initials: "ED",
      },
      category: "Community",
      status: "approved",
      date: "2023-05-08",
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Proposals</CardTitle>
        <CardDescription>Latest partnership proposals submitted</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} alt={proposal.submitter.name} />
                  <AvatarFallback className="bg-cedo-blue text-white text-xs">
                    {proposal.submitter.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{proposal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{proposal.submitter.name}</span>
                    <span>•</span>
                    <span>{formatDate(proposal.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    proposal.status === "approved"
                      ? "bg-green-500 hover:bg-green-500"
                      : proposal.status === "pending"
                        ? "bg-amber-500 hover:bg-amber-500"
                        : "bg-red-500 hover:bg-red-500"
                  }
                >
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
