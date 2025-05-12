"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, FileText } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Progress } from "@/components/ui/progress"

// Sample data for compliance tracking
const complianceData = [
  {
    id: "PROP-1002",
    title: "HIV Awareness Campaign",
    organization: "XU Medical Center",
    approvalDate: "2023-05-20",
    dueDate: "2023-06-20",
    status: "compliant",
    progress: 100,
    documents: [
      { name: "Final_Report.pdf", submitted: true },
      { name: "Attendance_Sheets.pdf", submitted: true },
      { name: "Budget_Report.xlsx", submitted: true },
      { name: "Photo_Documentation.zip", submitted: true },
    ],
  },
  {
    id: "PROP-1004",
    title: "Small Business Development Program",
    organization: "City Hall - Economic Development",
    approvalDate: "2023-05-18",
    dueDate: "2023-06-18",
    status: "pending",
    progress: 75,
    documents: [
      { name: "Progress_Report.pdf", submitted: true },
      { name: "Attendance_Sheets.pdf", submitted: true },
      { name: "Budget_Report.xlsx", submitted: true },
      { name: "Photo_Documentation.zip", submitted: false },
    ],
  },
  {
    id: "PROP-1006",
    title: "Environmental Clean-Up Initiative",
    organization: "Barangay Lapasan",
    approvalDate: "2023-05-10",
    dueDate: "2023-06-10",
    status: "overdue",
    progress: 50,
    documents: [
      { name: "Progress_Report.pdf", submitted: true },
      { name: "Attendance_Sheets.pdf", submitted: true },
      { name: "Budget_Report.xlsx", submitted: false },
      { name: "Photo_Documentation.zip", submitted: false },
    ],
  },
  {
    id: "PROP-1008",
    title: "Literacy Program for Adults",
    organization: "City Library",
    approvalDate: "2023-05-05",
    dueDate: "2023-06-05",
    status: "compliant",
    progress: 100,
    documents: [
      { name: "Final_Report.pdf", submitted: true },
      { name: "Attendance_Sheets.pdf", submitted: true },
      { name: "Budget_Report.xlsx", submitted: true },
      { name: "Photo_Documentation.zip", submitted: true },
    ],
  },
  {
    id: "PROP-1009",
    title: "Mental Health Awareness Seminar",
    organization: "City Health Office",
    approvalDate: "2023-05-02",
    dueDate: "2023-06-02",
    status: "overdue",
    progress: 25,
    documents: [
      { name: "Progress_Report.pdf", submitted: true },
      { name: "Attendance_Sheets.pdf", submitted: false },
      { name: "Budget_Report.xlsx", submitted: false },
      { name: "Photo_Documentation.zip", submitted: false },
    ],
  },
]

export default function CompliancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filter compliance data based on search term and status filter
  const filteredData = complianceData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader
        title="Compliance Tracking"
        subtitle="Monitor and manage compliance requirements for approved proposals"
      />

      <Card className="cedo-card">
        <CardHeader>
          <CardTitle className="text-cedo-blue">Compliance Dashboard</CardTitle>
          <CardDescription>
            Track the status of required documentation for approved partnership proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="compliant">Compliant</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>

              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="cedo-table-header">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="cedo-table-row">
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.organization}</TableCell>
                        <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === "compliant"
                                ? "bg-green-500 hover:bg-green-500"
                                : item.status === "pending"
                                  ? "bg-amber-500 hover:bg-amber-500"
                                  : "bg-red-500 hover:bg-red-500"
                            }
                          >
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={item.progress} className="h-2 w-20" />
                            <span className="text-xs">{item.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {item.documents.filter((doc) => doc.submitted).length}/{item.documents.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Other tab contents would go here */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
