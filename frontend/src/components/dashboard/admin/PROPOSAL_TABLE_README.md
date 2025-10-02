# Enhanced Proposal Table Component

A comprehensive, feature-rich proposal management table component with advanced search, filtering, sorting, and bulk operations.

## 🚀 Features

### Core Components

1. **ProposalTable** - Main table component with desktop and mobile views
2. **StatusTabs** - Status-based filtering with counts
3. **FilterBar** - Advanced search and filtering controls
4. **DetailsDrawer** - Side panel for detailed proposal view
5. **BulkActionToolbar** - Bulk operations with confirmation dialogs
6. **ProposalStats** - Statistics dashboard cards
7. **SearchSuggestions** - Auto-complete search suggestions
8. **ViewModeToggle** - Switch between table, card, and timeline views
9. **QuickFilters** - One-click common filter presets

### Advanced Features

- **Responsive Design**: Desktop table view and mobile card layout
- **Real-time Search**: Debounced search across multiple fields
- **Multi-column Sorting**: Click headers to sort by any field
- **Advanced Filtering**: Date ranges, organization types, priorities, assignments
- **Bulk Operations**: Approve, reject, export, assign, tag multiple proposals
- **Status Management**: Visual status indicators with counts
- **Pagination**: Configurable page sizes with navigation
- **File Management**: View and download attached files
- **Comments System**: Add and view comments on proposals
- **Export Options**: CSV, Excel, PDF, and JSON export formats

## 📦 Installation

The component uses the following UI dependencies (already included in your project):

```bash
# Required UI components (already installed)
@/components/ui/badge
@/components/ui/button
@/components/ui/dropdown-menu
@/components/ui/input
@/components/ui/select
@/components/ui/popover
@/components/ui/calendar
@/components/ui/scroll-area
@/components/ui/table
@/components/ui/checkbox
@/components/ui/dialog
@/components/ui/textarea

# Required utilities
lodash.debounce
date-fns
lucide-react
```

## 🎯 Usage

### Basic Implementation

```jsx
import {
  ProposalTable,
  StatusTabs,
  FilterBar,
  DetailsDrawer,
  BulkActionToolbar,
  ProposalStats
} from "@/components/dashboard/admin/proposal-table"

function ProposalsPage() {
  const [proposals, setProposals] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: null,
    organizationType: null,
    dateRange: null,
    priority: null,
    assignedTo: null,
    fileCount: null,
  })
  const [sortConfig, setSortConfig] = useState({ field: "date", direction: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [focusedProposalId, setFocusedProposalId] = useState(null)

  return (
    <div className="space-y-6">
      <ProposalStats stats={stats} />
      <StatusTabs activeStatus={filters.status} statusCounts={statusCounts} onStatusChange={handleStatusChange} />
      <FilterBar filters={filters} onFiltersChange={setFilters} onClearFilters={handleClearFilters} />
      <BulkActionToolbar selectedCount={selectedIds.length} onBulkAction={handleBulkAction} onClearSelection={() => setSelectedIds([])} />
      <ProposalTable
        proposals={proposals}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={handleRowClick}
        onProposalAction={handleProposalAction}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        focusedProposalId={focusedProposalId}
      />
      {focusedProposalId && (
        <DetailsDrawer
          proposalId={focusedProposalId}
          onClose={() => setFocusedProposalId(null)}
          onProposalAction={handleProposalAction}
        />
      )}
    </div>
  )
}
```

### Complete Example

See `proposal-table-example.jsx` for a full implementation with mock data and all features demonstrated.

## 📊 Data Structure

### Proposal Object

```typescript
interface Proposal {
  id: string
  eventName: string
  organization: string
  organizationType?: 'corporate' | 'nonprofit' | 'government' | 'educational' | 'other'
  contact: {
    name: string
    email: string
    phone?: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'draft'
  date: string // ISO date string
  type: 'Conference' | 'Workshop' | 'Seminar' | 'Exhibition' | 'Other'
  priority?: 'high' | 'medium' | 'low'
  assignedTo?: string
  description?: string
  location?: string
  expectedAttendees?: number
  budget?: number
  files?: Array<{
    id: string
    name: string
    size: string
    uploadedBy: string
    uploadedAt: string
  }>
  comments?: Array<{
    id: string
    author: string
    content: string
    timestamp: string
    type: 'system' | 'admin' | 'user'
  }>
}
```

## 🎨 Customization

### Status Configuration

```jsx
const statusTabsConfig = {
  all: { label: "All", color: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", color: "bg-warning/20 text-warning" },
  approved: { label: "Approved", color: "bg-success/20 text-success" },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive" },
  draft: { label: "Drafts", color: "bg-info/20 text-info" },
}
```

### Filter Options

```jsx
const filterOptions = {
  type: ['Conference', 'Workshop', 'Seminar', 'Exhibition', 'Other'],
  organizationType: ['corporate', 'nonprofit', 'government', 'educational', 'other'],
  priority: ['high', 'medium', 'low'],
  assignedTo: ['admin', 'reviewer', 'unassigned'],
  fileCount: ['none', '1-3', '4-6', '7+']
}
```

## 🔧 API Integration

### Event Handlers

```jsx
// Handle bulk actions
const handleBulkAction = (action, comment) => {
  switch (action) {
    case 'approve':
      // Call API to approve selected proposals
      break
    case 'reject':
      // Call API to reject selected proposals
      break
    case 'export':
      // Generate and download export file
      break
    default:
      console.log(`Bulk action: ${action}`, { comment })
  }
}

// Handle individual proposal actions
const handleProposalAction = (proposalId, action, comment) => {
  switch (action) {
    case 'approve':
      // Call API to approve proposal
      break
    case 'reject':
      // Call API to reject proposal
      break
    case 'edit':
      // Navigate to edit page or open edit modal
      break
    case 'delete':
      // Call API to delete proposal
      break
    default:
      console.log(`Proposal action: ${action}`, { proposalId, comment })
  }
}
```

### Data Fetching

```jsx
// Fetch proposals with filters
const fetchProposals = async (filters, sortConfig, page, pageSize) => {
  const params = new URLSearchParams({
    ...filters,
    sortField: sortConfig.field,
    sortDirection: sortConfig.direction,
    page: page.toString(),
    limit: pageSize.toString()
  })
  
  const response = await fetch(`/api/proposals?${params}`)
  return response.json()
}
```

## 🎯 Performance Optimizations

- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Memoized Calculations**: Stats and counts are calculated only when data changes
- **Virtual Scrolling**: For large datasets (can be added)
- **Lazy Loading**: Load additional data as needed

## 📱 Responsive Behavior

- **Desktop**: Full table with all columns visible
- **Tablet**: Condensed table with essential columns
- **Mobile**: Card-based layout with key information

## 🧪 Testing

The component is designed to be easily testable with:

- Mock data support
- Isolated component testing
- Event handler testing
- Responsive behavior testing

## 🔮 Future Enhancements

- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Search**: Full-text search with highlighting
- **Custom Columns**: User-configurable column visibility
- **Data Visualization**: Charts and graphs for proposal analytics
- **Workflow Automation**: Automated approval workflows
- **Integration**: Calendar integration, email notifications

## 📄 License

This component is part of the CEDO project and follows the same licensing terms.






