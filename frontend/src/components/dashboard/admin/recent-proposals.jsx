import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const recentProposals = [
  {
    id: "PROP-1234",
    title: "Annual Science Fair",
    submitter: {
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "AJ",
    },
    category: "Academic",
    status: "approved",
    date: "2023-03-15",
  },
  {
    id: "PROP-1235",
    title: "Leadership Workshop Series",
    submitter: {
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MG",
    },
    category: "Development",
    status: "pending",
    date: "2023-03-14",
  },
  {
    id: "PROP-1236",
    title: "Community Service Day",
    submitter: {
      name: "David Kim",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "DK",
    },
    category: "Community",
    status: "rejected",
    date: "2023-03-12",
  },
  {
    id: "PROP-1237",
    title: "Cultural Exchange Program",
    submitter: {
      name: "Sarah Patel",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SP",
    },
    category: "Cultural",
    status: "pending",
    date: "2023-03-10",
  },
  {
    id: "PROP-1238",
    title: "Tech Innovation Showcase",
    submitter: {
      name: "James Wilson",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JW",
    },
    category: "Technology",
    status: "approved",
    date: "2023-03-08",
  },
]

export function RecentProposals() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium">{proposal.id}</TableCell>
                <TableCell>{proposal.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-[#0c2d6b] text-white">
                        {proposal.submitter.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{proposal.submitter.name}</span>
                  </div>
                </TableCell>
                <TableCell>{proposal.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      proposal.status === "approved"
                        ? "default"
                        : proposal.status === "pending"
                          ? "outline"
                          : "destructive"
                    }
                    className={
                      proposal.status === "approved"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : proposal.status === "pending"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : ""
                    }
                  >
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(proposal.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          View All Proposals
        </Button>
      </div>
    </div>
  )
}
