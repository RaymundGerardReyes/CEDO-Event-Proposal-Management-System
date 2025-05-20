import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardStats({ title, value, description, icon }) {
  return (
    <Card className="hover-card-effect">
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
