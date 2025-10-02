// ProposalTable.js
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useProposals } from "@/hooks/useProposals"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import debounce from "lodash.debounce"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building,
  Calendar as CalendarDays,
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Settings,
  Star,
  Tag,
  Trash2,
  User,
  Users,
  X,
  XCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export function ProposalTable({
  statusFilter = "all",
  proposals = null, // Changed to null to detect if data should be fetched
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  onProposalAction,
  isLoading = false,
  currentPage = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  sortConfig,
  onSortChange,
  focusedProposalId,
}) {
  // Use internal state if no props provided, otherwise use props
  const isInternalMode = proposals === null

  // Use the existing useProposals hook for internal mode
  const {
    proposals: hookProposals,
    pagination,
    loading: hookLoading,
    error: hookError,
    status: hookStatus,
    page: hookPage,
    limit: hookLimit,
    search: hookSearch,
    sort: hookSort,
    uuid: hookUuid,
    detailsOpen,
    selected,
    setStatus,
    setPage,
    setLimit,
    setSearch,
    setSort,
    refetch,
    openDetailsModal,
    closeDetailsModal,
    approve,
    deny,
    bulkApprove,
    bulkDeny,
  } = useProposals({
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  })

  // Internal state for selection and UI
  const [internalSelectedIds, setInternalSelectedIds] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    status: statusFilter,
    type: null,
    organizationType: null,
    dateRange: null,
    priority: null,
    assignedTo: null,
    fileCount: null,
  })

  // Use hook data for internal mode, props for external mode
  const actualProposals = isInternalMode ? hookProposals : proposals
  const actualSelectedIds = isInternalMode ? internalSelectedIds : selectedIds
  const actualIsLoading = isInternalMode ? hookLoading : isLoading
  const actualCurrentPage = isInternalMode ? hookPage : currentPage
  const actualPageSize = isInternalMode ? hookLimit : pageSize
  const actualTotalCount = isInternalMode ? pagination?.totalCount || 0 : totalCount
  const actualSortConfig = isInternalMode ? hookSort : sortConfig
  const actualFocusedProposalId = isInternalMode ? hookUuid : focusedProposalId

  // Debug logging (only log when values actually change)
  const debugInfo = {
    isInternalMode,
    proposalsProvided: proposals !== null,
    proposalsCount: actualProposals?.length || 0,
    statusFilter
  }

  // Only log when values change to prevent spam
  useEffect(() => {
    console.log('🔍 ProposalTable mode check:', debugInfo)
  }, [isInternalMode, actualProposals?.length, statusFilter])

  const [expandedRows, setExpandedRows] = useState([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (actualFocusedProposalId && !expandedRows.includes(actualFocusedProposalId)) {
      setExpandedRows((prev) => [...prev, actualFocusedProposalId])
    }
  }, [actualFocusedProposalId])

  // Update status filter when prop changes
  useEffect(() => {
    if (isInternalMode) {
      setStatus(statusFilter)
    }
    setFilters(prev => ({ ...prev, status: statusFilter }))
  }, [statusFilter, isInternalMode, setStatus])

  // Event handlers that work with both internal and external modes
  const handleSelectAll = (checked) => {
    const targetProposals = actualProposals
    const targetOnSelectionChange = isInternalMode ? setInternalSelectedIds : onSelectionChange
    const targetSelectedIds = actualSelectedIds

    if (checked) {
      targetOnSelectionChange(targetProposals.map((p) => p.id))
    } else {
      targetOnSelectionChange([])
    }
  }

  const handleSelectRow = (id, checked) => {
    const targetOnSelectionChange = isInternalMode ? setInternalSelectedIds : onSelectionChange
    const targetSelectedIds = actualSelectedIds

    if (checked) {
      targetOnSelectionChange([...targetSelectedIds, id])
    } else {
      targetOnSelectionChange(targetSelectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleSort = (field) => {
    if (isInternalMode) {
      const currentSort = actualSortConfig || {}
      const newDirection = currentSort.field === field && currentSort.direction === "asc" ? "desc" : "asc"
      setSort({ field, direction: newDirection })
    } else if (onSortChange) {
      onSortChange(field)
    }
  }

  const handleFiltersChange = (newFilters) => {
    if (isInternalMode) {
      setFilters(prev => ({ ...prev, ...newFilters }))
      // Update hook search if search filter changes
      if (newFilters.search !== undefined) {
        setSearch(newFilters.search)
      }
      setPage(1) // Reset to first page when filters change
    }
  }

  const handleClearFilters = () => {
    if (isInternalMode) {
      setFilters({
        search: "",
        status: statusFilter,
        type: null,
        organizationType: null,
        dateRange: null,
        priority: null,
        assignedTo: null,
        fileCount: null,
      })
      setSearch("")
      setPage(1)
    }
  }

  const handleBulkAction = async (action, comment) => {
    if (!isInternalMode) {
      if (onProposalAction) {
        onProposalAction('bulk', action, comment)
      }
      return
    }

    try {
      switch (action) {
        case 'approve':
          await bulkApprove(actualSelectedIds, comment)
          break
        case 'reject':
          await bulkDeny(actualSelectedIds, comment)
          break
        default:
          console.log(`Bulk action: ${action} on ${actualSelectedIds.length} proposals`, { comment })
          return
      }
      setInternalSelectedIds([])
      // Hook will automatically refetch data
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const handleProposalAction = async (proposalId, action, comment) => {
    if (!isInternalMode) {
      if (onProposalAction) {
        onProposalAction(proposalId, action, comment)
      }
      return
    }

    try {
      switch (action) {
        case 'approve':
          await approve(proposalId, comment)
          break
        case 'reject':
          await deny(proposalId, comment)
          break
        case 'comment':
          // Note: addProposalComment is not in the hook, would need to be added
          console.log(`Comment action not implemented in hook yet: ${proposalId}`, { comment })
          return
        default:
          console.log(`Proposal action: ${action} on proposal ${proposalId}`, { comment })
          return
      }
      // Hook will automatically refetch data
    } catch (error) {
      console.error('Error performing proposal action:', error)
    }
  }

  const router = useRouter()

  const handleRowClick = (proposal) => {
    console.log('🔍 handleRowClick triggered:', {
      isInternalMode,
      proposal,
      proposalUuid: proposal.uuid,
      proposalId: proposal.id,
      hasOnRowClick: !!onRowClick
    })

    // Prevent navigation if clicking on interactive elements
    if (event?.target?.closest('button, input, select, textarea, a')) {
      console.log('🚫 Navigation prevented - clicked on interactive element')
      return
    }

    if (isInternalMode) {
      // Navigate to proposal detail page using UUID
      const proposalUuid = proposal.uuid || proposal.id
      console.log('🎯 Navigation attempt:', {
        proposalUuid,
        navigationUrl: `/admin-dashboard/proposals/${proposalUuid}`,
        uuidType: typeof proposalUuid,
        uuidLength: proposalUuid?.length
      })

      if (proposalUuid) {
        try {
          // Validate UUID format before navigation
          const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          if (uuidRegex.test(proposalUuid)) {
            router.push(`/admin-dashboard/proposals/${proposalUuid}`)
            console.log('✅ Navigation successful to:', `/admin-dashboard/proposals/${proposalUuid}`)
          } else {
            console.error('❌ Invalid UUID format:', proposalUuid)
            // Fallback to ID-based navigation if UUID is invalid
            router.push(`/admin-dashboard/proposals/${proposal.id}`)
            console.log('🔄 Fallback navigation to ID:', proposal.id)
          }
        } catch (error) {
          console.error('❌ Navigation failed:', error)
          // Show user-friendly error message
          alert('Failed to navigate to proposal details. Please try again.')
        }
      } else {
        console.error('❌ No UUID or ID found for proposal:', proposal)
        alert('Unable to navigate: Proposal identifier not found.')
      }
    } else if (onRowClick) {
      onRowClick(proposal)
    }
  }

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const getSortIcon = (field) => {
    if (!actualSortConfig || actualSortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return actualSortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  if (actualIsLoading) {
    return (
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const safeProposals = Array.isArray(actualProposals) ? actualProposals : []
  const safeSelected = Array.isArray(actualSelectedIds) ? actualSelectedIds : []
  const allSelected = safeProposals.length > 0 && safeSelected.length === safeProposals.length
  const someSelected = safeSelected.length > 0 && safeSelected.length < safeProposals.length

  // Render enhanced features when in internal mode
  if (isInternalMode) {
    return (
      <div className="space-y-6">
        {/* Enhanced Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Bulk Action Toolbar */}
        <BulkActionToolbar
          selectedCount={safeSelected.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setInternalSelectedIds([])}
        />

        {/* Proposal Table */}
        <div className="bg-card rounded-lg border">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all proposals"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('eventName')}
                  >
                    <div className="flex items-center">
                      Event Name
                      {getSortIcon('eventName')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('organization')}
                  >
                    <div className="flex items-center">
                      Organization
                      {getSortIcon('organization')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('contact.name')}
                  >
                    <div className="flex items-center">
                      Contact
                      {getSortIcon('contact.name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Event Date
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      Type
                      {getSortIcon('type')}
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeProposals.map((proposal) => (
                  <TableRow
                    key={proposal.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      safeSelected.includes(proposal.id) && "bg-primary/5",
                      expandedRows.includes(proposal.id) && "bg-muted/30"
                    )}
                    onClick={() => handleRowClick(proposal)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(proposal);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${proposal.eventName}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={safeSelected.includes(proposal.id)}
                        onCheckedChange={(checked) => handleSelectRow(proposal.id, checked)}
                        aria-label={`Select ${proposal.eventName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{proposal.eventName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {proposal.description || 'No description provided'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{proposal.organization}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{proposal.contact?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{proposal.contact?.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={proposal.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {proposal.date ? format(new Date(proposal.date), 'MMM dd, yyyy') : 'TBD'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {proposal.type || 'Other'}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRowClick && onRowClick(proposal)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onProposalAction && onProposalAction(proposal.id, 'approve')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onProposalAction && onProposalAction(proposal.id, 'reject')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onProposalAction && onProposalAction(proposal.id, 'edit')}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onProposalAction && onProposalAction(proposal.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <div className="p-4 space-y-4">
              {safeProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={cn(
                    "border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    safeSelected.includes(proposal.id) && "bg-primary/5 border-primary/20"
                  )}
                  onClick={() => handleRowClick(proposal)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(proposal);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${proposal.eventName}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={safeSelected.includes(proposal.id)}
                        onCheckedChange={(checked) => handleSelectRow(proposal.id, checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm">{proposal.eventName}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {proposal.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={proposal.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{proposal.organization}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span>{proposal.date ? format(new Date(proposal.date), 'MMM dd') : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{proposal.contact?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <span>{proposal.type || 'Other'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{proposal.contact?.email}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowClick && onRowClick(proposal)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onProposalAction && onProposalAction(proposal.id, 'approve')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onProposalAction && onProposalAction(proposal.id, 'reject')}>
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {(actualTotalCount > actualPageSize || actualCurrentPage > 1) && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((actualCurrentPage - 1) * actualPageSize + 1, actualTotalCount)} to {Math.min(actualCurrentPage * actualPageSize, actualTotalCount)} of {actualTotalCount} proposals
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={actualPageSize.toString()}
                  onValueChange={(value) => {
                    const newPageSize = parseInt(value)
                    if (isInternalMode) {
                      setLimit(newPageSize)
                    } else if (onPageSizeChange) {
                      onPageSizeChange(newPageSize)
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isInternalMode) {
                        setPage(actualCurrentPage - 1)
                      } else if (onPageChange) {
                        onPageChange(actualCurrentPage - 1)
                      }
                    }}
                    disabled={actualCurrentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {actualCurrentPage} of {Math.ceil(actualTotalCount / actualPageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isInternalMode) {
                        setPage(actualCurrentPage + 1)
                      } else if (onPageChange) {
                        onPageChange(actualCurrentPage + 1)
                      }
                    }}
                    disabled={actualCurrentPage >= Math.ceil(actualTotalCount / actualPageSize)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details Drawer */}
        {detailsOpen && selected && (
          <div className="fixed inset-y-0 right-0 z-50 w-96">
            <DetailsDrawer
              proposal={selected}
              onClose={closeDetailsModal}
              onProposalAction={handleProposalAction}
            />
          </div>
        )}
      </div>
    )
  }

  // Original simple table for external mode
  return (
    <div className="bg-card rounded-lg border">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all proposals"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('eventName')}
              >
                <div className="flex items-center">
                  Event Name
                  {getSortIcon('eventName')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('organization')}
              >
                <div className="flex items-center">
                  Organization
                  {getSortIcon('organization')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('contact.name')}
              >
                <div className="flex items-center">
                  Contact
                  {getSortIcon('contact.name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Event Date
                  {getSortIcon('date')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeProposals.map((proposal) => (
              <TableRow
                key={proposal.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  safeSelected.includes(proposal.id) && "bg-primary/5",
                  expandedRows.includes(proposal.id) && "bg-muted/30"
                )}
                onClick={() => handleRowClick(proposal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(proposal);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${proposal.eventName}`}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={safeSelected.includes(proposal.id)}
                    onCheckedChange={(checked) => handleSelectRow(proposal.id, checked)}
                    aria-label={`Select ${proposal.eventName}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{proposal.eventName}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {proposal.description || 'No description provided'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{proposal.organization}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{proposal.contact?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{proposal.contact?.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill status={proposal.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {proposal.date ? format(new Date(proposal.date), 'MMM dd, yyyy') : 'TBD'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {proposal.type || 'Other'}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRowClick(proposal)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleProposalAction(proposal.id, 'approve')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleProposalAction(proposal.id, 'reject')}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleProposalAction(proposal.id, 'edit')}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleProposalAction(proposal.id, 'delete')}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="p-4 space-y-4">
          {safeProposals.map((proposal) => (
            <div
              key={proposal.id}
              className={cn(
                "border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors",
                safeSelected.includes(proposal.id) && "bg-primary/5 border-primary/20"
              )}
              onClick={() => handleRowClick(proposal)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick(proposal);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${proposal.eventName}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={safeSelected.includes(proposal.id)}
                    onCheckedChange={(checked) => handleSelectRow(proposal.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{proposal.eventName}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {proposal.description || 'No description provided'}
                    </p>
                  </div>
                </div>
                <StatusPill status={proposal.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{proposal.organization}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3 h-3 text-muted-foreground" />
                  <span>{proposal.date ? format(new Date(proposal.date), 'MMM dd') : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{proposal.contact?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span>{proposal.type || 'Other'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{proposal.contact?.email}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRowClick(proposal)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProposalAction(proposal.id, 'approve')}>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProposalAction(proposal.id, 'reject')}>
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {(actualTotalCount > actualPageSize || actualCurrentPage > 1) && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((actualCurrentPage - 1) * actualPageSize + 1, actualTotalCount)} to {Math.min(actualCurrentPage * actualPageSize, actualTotalCount)} of {actualTotalCount} proposals
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={actualPageSize.toString()}
              onValueChange={(value) => {
                const newPageSize = parseInt(value)
                if (isInternalMode) {
                  setInternalPageSize(newPageSize)
                } else if (onPageSizeChange) {
                  onPageSizeChange(newPageSize)
                }
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isInternalMode) {
                    setInternalCurrentPage(actualCurrentPage - 1)
                  } else if (onPageChange) {
                    onPageChange(actualCurrentPage - 1)
                  }
                }}
                disabled={actualCurrentPage <= 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {actualCurrentPage} of {Math.ceil(actualTotalCount / actualPageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isInternalMode) {
                    setInternalCurrentPage(actualCurrentPage + 1)
                  } else if (onPageChange) {
                    onPageChange(actualCurrentPage + 1)
                  }
                }}
                disabled={actualCurrentPage >= Math.ceil(actualTotalCount / actualPageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------ Status Tabs ------------------ */

const statusTabsConfig = {
  all: { label: "All", color: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", color: "bg-warning/20 text-warning" },
  approved: { label: "Approved", color: "bg-success/20 text-success" },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive" },
  draft: { label: "Drafts", color: "bg-info/20 text-info" },
}

export function StatusTabs({ activeStatus, statusCounts, onStatusChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Object.entries(statusTabsConfig).map(([status, config]) => {
        const isActive = activeStatus === status
        const count = statusCounts[status] || 0

        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-card-foreground border-border hover:bg-accent",
            )}
          >
            <span className="font-medium">{config.label}</span>
            <Badge
              variant="secondary"
              className={cn("text-xs", isActive ? "bg-primary-foreground/20 text-primary-foreground" : config.color)}
            >
              {count}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------ Status Pill ------------------ */

const statusPillConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Awaiting review",
  },
  approved: {
    label: "Approved",
    icon: Check,
    className: "bg-green-100 text-green-800 border-green-200",
    description: "Approved for event",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    className: "bg-red-100 text-red-800 border-red-200",
    description: "Not approved",
  },
  denied: {
    label: "Denied",
    icon: X,
    className: "bg-red-100 text-red-800 border-red-200",
    description: "Not approved",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Work in progress",
  },
}

export function StatusPill({ status, showTooltip = true }) {
  const config = statusPillConfig[status] || {
    label: "Unknown",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
    description: "Unknown status",
  }

  const Icon = config.icon

  return (
    <Badge
      className={cn("flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border", config.className)}
      title={showTooltip ? config.description : undefined}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

/* ------------------ Filter Bar ------------------ */

export function FilterBar({ filters, onFiltersChange, onClearFilters }) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const debouncedSearch = useCallback(
    debounce((value) => {
      onFiltersChange({ ...filters, search: value })
    }, 300),
    [filters, onFiltersChange]
  )

  useEffect(() => {
    debouncedSearch(searchValue)
  }, [searchValue, debouncedSearch])

  const handleSearchChange = (value) => setSearchValue(value)
  const handleTypeFilter = (type) => onFiltersChange({ ...filters, type })
  const handleOrgTypeFilter = (orgType) => onFiltersChange({ ...filters, organizationType: orgType })
  const handleDateRangeChange = (range) => {
    onFiltersChange({ ...filters, dateRange: range })
    setIsDatePickerOpen(false)
  }

  const activeFiltersCount = [
    filters.search,
    filters.dateRange,
    filters.type,
    filters.organizationType,
    filters.priority,
    filters.assignedTo,
    filters.tags?.length,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-card rounded-lg border">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by event, contact, email, organization..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 focus-ring"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchValue("")
              onFiltersChange({ ...filters, search: "" })
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Filter */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                filters.dateRange && "bg-primary/10 border-primary/20"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange
                ? `${format(filters.dateRange.from, "MMM dd")} - ${format(filters.dateRange.to, "MMM dd")}`
                : "Date Range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleDateRangeChange({ from: range.from, to: range.to })
                } else {
                  handleDateRangeChange(null)
                }
              }}
              numberOfMonths={2}
            />
            <div className="p-3 border-t">
              <Button variant="outline" size="sm" onClick={() => handleDateRangeChange(null)} className="w-full">
                Clear Date Range
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Event Type Filter */}
        <Select value={filters.type || "all"} onValueChange={(value) => handleTypeFilter(value || null)}>
          <SelectTrigger className={cn("w-[140px]", filters.type && "bg-primary/10 border-primary/20")}>
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="seminar">Seminar</SelectItem>
            <SelectItem value="exhibition">Exhibition</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Organization Type Filter */}
        <Select
          value={filters.organizationType || "all"}
          onValueChange={(value) => handleOrgTypeFilter(value || null)}
        >
          <SelectTrigger className={cn("w-[160px]", filters.organizationType && "bg-primary/10 border-primary/20")}>
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            <SelectItem value="nonprofit">Non-profit</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">Priority Level</div>
              <Select value={filters.priority || "all"} onValueChange={(value) => onFiltersChange({ ...filters, priority: value === "all" ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">Assigned To</div>
              <Select value={filters.assignedTo || "all"} onValueChange={(value) => onFiltersChange({ ...filters, assignedTo: value === "all" ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">File Count</div>
              <Select value={filters.fileCount || "all"} onValueChange={(value) => onFiltersChange({ ...filters, fileCount: value === "all" ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="File Count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Files</SelectItem>
                  <SelectItem value="none">No Files</SelectItem>
                  <SelectItem value="1-3">1-3 Files</SelectItem>
                  <SelectItem value="4-6">4-6 Files</SelectItem>
                  <SelectItem value="7+">7+ Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear ({activeFiltersCount})
          </Button>
        )}

        {/* Saved Views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Saved Views
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>💾 Save Current View</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>📋 Recent Proposals</DropdownMenuItem>
            <DropdownMenuItem>⚡ High Priority</DropdownMenuItem>
            <DropdownMenuItem>⏰ Due This Week</DropdownMenuItem>
            <DropdownMenuItem>👤 My Assignments</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>
    </div>
  )
}

/* ------------------ Details Drawer ------------------ */

const mockProposal = {
  id: "1",
  eventName: "Tech Conference 2024",
  organization: "TechCorp Inc.",
  contact: {
    name: "John Smith",
    email: "john.smith@techcorp.com",
  },
  status: "pending",
  date: "2024-03-15",
  type: "Conference",
  description: "Annual technology conference featuring the latest innovations in AI and machine learning.",
  files: [
    { id: "1", name: "proposalData.pdf", size: "2.4 MB", uploadedBy: "John Smith", uploadedAt: "2024-01-15" },
    { id: "2", name: "budget.xlsx", size: "1.2 MB", uploadedBy: "John Smith", uploadedAt: "2024-01-15" },
    { id: "3", name: "venue-layout.png", size: "3.1 MB", uploadedBy: "John Smith", uploadedAt: "2024-01-16" },
  ],
  comments: [
    { id: "1", author: "Admin", content: "Initial review completed", timestamp: "2024-01-20", type: "system" },
    {
      id: "2",
      author: "Sarah Johnson",
      content: "Budget looks reasonable, need to verify venue availability",
      timestamp: "2024-01-22",
      type: "admin",
    },
  ],
}

export function DetailsDrawer({ proposal, onClose, onProposalAction }) {
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Use the proposal passed as prop instead of fetching
  const proposalData = proposal || mockProposal

  const handleAction = (action) => {
    onProposalAction(proposalData.id, action, comment)
    setComment("")
  }

  if (isLoading) {
    return (
      <div className="w-96 bg-card border-l border-border">
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!proposalData) {
    return (
      <div className="w-96 bg-card border-l border-border">
        <div className="p-6 text-center text-muted-foreground">Proposal not found</div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-pretty">Proposal Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{proposalData.eventName}</h3>
              <div className="flex items-center gap-2 mb-3">
                <StatusPill status={proposalData.status} />
                <Badge variant="outline">{proposalData.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {proposalData.description || 'No description provided for this event proposalData.'}
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Contact Information</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{proposalData.contact?.name}</div>
                    <div className="text-xs text-muted-foreground">Primary Contact</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">{proposalData.contact?.email}</div>
                    <div className="text-xs text-muted-foreground">Email Address</div>
                  </div>
                </div>
                {proposalData.contact?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{proposalData.contact.phone}</div>
                      <div className="text-xs text-muted-foreground">Phone Number</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Organization</h4>
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">{proposalData.organization}</div>
                  <div className="text-xs text-muted-foreground">Organization Name</div>
                </div>
              </div>
              {proposalData.organizationType && (
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm capitalize">{proposalData.organizationType}</div>
                    <div className="text-xs text-muted-foreground">Organization Type</div>
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Event Details</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">
                      {proposalData.date ? format(new Date(proposalData.date), 'EEEE, MMMM dd, yyyy') : 'Date TBD'}
                    </div>
                    <div className="text-xs text-muted-foreground">Event Date</div>
                  </div>
                </div>
                {proposalData.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{proposalData.location}</div>
                      <div className="text-xs text-muted-foreground">Venue/Location</div>
                    </div>
                  </div>
                )}
                {proposalData.expectedAttendees && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{proposalData.expectedAttendees} attendees</div>
                      <div className="text-xs text-muted-foreground">Expected Attendance</div>
                    </div>
                  </div>
                )}
                {proposalData.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">${proposalData.budget.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Estimated Budget</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            {proposalData.files && proposalData.files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Attached Files</h4>
                <div className="space-y-2">
                  {proposalData.files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.size} • Uploaded by {file.uploadedBy} on {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {proposalData.comments && proposalData.comments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Comments & Notes</h4>
                <div className="space-y-3">
                  {proposalData.comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.timestamp), 'MMM dd, yyyy')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {comment.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction('approve')}
            className="flex-1"
            disabled={proposalData.status === 'approved'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {proposalData.status === 'approved' ? 'Approved' : 'Approve'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction('reject')}
            className="flex-1"
            disabled={proposalData.status === 'rejected'}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {proposalData.status === 'rejected' ? 'Rejected' : 'Reject'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Comment Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add Comment</label>
          <Textarea
            placeholder="Add a comment or note..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={() => handleAction('comment')}
            disabled={!comment.trim()}
            size="sm"
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------ Bulk Action Toolbar ------------------ */

export function BulkActionToolbar({ selectedCount, onBulkAction, onClearSelection }) {
  const [comment, setComment] = useState("")
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")

  const handleBulkAction = (action) => {
    onBulkAction(action, comment)
    setComment("")
    setIsApproveDialogOpen(false)
    setIsRejectDialogOpen(false)
  }

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log(`Exporting ${selectedCount} proposals as ${exportFormat}`)
    setIsExportDialogOpen(false)
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {selectedCount} selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            {selectedCount} proposal{selectedCount !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Approve Dialog */}
          <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve {selectedCount} proposal{selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Approval Comment (Optional)</label>
                  <Textarea
                    placeholder="Add a comment for the approval..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleBulkAction('approve')}>
                  Approve {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reject {selectedCount} proposal{selectedCount !== 1 ? "s" : ""}? Please provide a reason for rejection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rejection Reason (Required)</label>
                  <Textarea
                    placeholder="Please provide a reason for rejection..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkAction('reject')}
                  disabled={!comment.trim()}
                >
                  Reject {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Export Dialog */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}</DialogTitle>
                <DialogDescription>
                  Choose the format for exporting the selected proposals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  The export will include: Event name, organization, contact info, status, date, type, and description.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedCount} Proposal{selectedCount !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Additional Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkAction('assign')}>
                <User className="w-4 h-4 mr-2" />
                Assign to Reviewer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('priority')}>
                <Star className="w-4 h-4 mr-2" />
                Set Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('tag')}>
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onBulkAction('archive')}>
                <FileCheck className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction('delete')}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </>
  )
}

/* ------------------ Additional Utility Components ------------------ */

// Quick Stats Component
export function ProposalStats({ stats }) {
  const statsConfig = {
    total: { label: "Total", color: "bg-blue-500", icon: FileText },
    pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
    approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Object.entries(statsConfig).map(([key, config]) => {
        const Icon = config.icon
        const value = stats[key] || 0
        return (
          <div key={key} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{config.label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <div className={cn("p-2 rounded-full", config.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Search Suggestions Component
export function SearchSuggestions({ suggestions = [], onSuggestionClick, isVisible = false }) {
  if (!isVisible || suggestions.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-50 mt-1 max-h-60 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="w-full text-left px-4 py-2 hover:bg-muted/50 text-sm flex items-center gap-2"
        >
          <Search className="w-3 h-3 text-muted-foreground" />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  )
}

// View Mode Toggle Component
export function ViewModeToggle({ currentView, onViewChange }) {
  const views = [
    { key: 'table', label: 'Table View', icon: FileText },
    { key: 'cards', label: 'Card View', icon: Calendar },
    { key: 'timeline', label: 'Timeline View', icon: Clock },
  ]

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      {views.map((view) => {
        const Icon = view.icon
        return (
          <Button
            key={view.key}
            variant={currentView === view.key ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view.key)}
            className="h-8 px-3"
          >
            <Icon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

// Quick Filters Component
export function QuickFilters({ onFilterApply }) {
  const quickFilters = [
    { label: "Due This Week", filter: { dateRange: "week" } },
    { label: "High Priority", filter: { priority: "high" } },
    { label: "No Files", filter: { fileCount: "none" } },
    { label: "My Assignments", filter: { assignedTo: "me" } },
    { label: "Overdue", filter: { overdue: true } },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((quickFilter) => (
        <Button
          key={quickFilter.label}
          variant="outline"
          size="sm"
          onClick={() => onFilterApply(quickFilter.filter)}
          className="text-xs"
        >
          {quickFilter.label}
        </Button>
      ))}
    </div>
  )
}
