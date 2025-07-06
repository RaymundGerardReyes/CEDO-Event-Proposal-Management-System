import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardStats({ title, value, description, icon, className = "" }) {
  return (
    <Card className={`hover-card-effect ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#0c2d6b]">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0c2d6b]">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Enhanced stats component with loading state
export function DashboardStatsWithLoading({ title, value, description, icon, isLoading = false, className = "" }) {
  if (isLoading) {
    return (
      <Card className={`hover-card-effect ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-[#0c2d6b]">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#0c2d6b] animate-pulse bg-gray-200 h-8 rounded"></div>
          <p className="text-xs text-muted-foreground animate-pulse bg-gray-200 h-3 rounded mt-1"></p>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardStats
      title={title}
      value={value}
      description={description}
      icon={icon}
      className={className}
    />
  )
}
