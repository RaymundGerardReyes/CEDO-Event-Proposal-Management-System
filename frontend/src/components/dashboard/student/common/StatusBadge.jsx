// student/common/StatusBadge.jsx
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Clock, HelpCircle, XCircle } from "lucide-react"

const StatusBadge = ({ status, className, showIcon = true, size = "default", ...props }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "complete":
      case "success":
        return {
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          className: "bg-green-100 text-green-800 border-green-200",
        }
      case "denied":
      case "rejected":
      case "error":
        return {
          icon: <XCircle className="h-3.5 w-3.5" />,
          className: "bg-red-100 text-red-800 border-red-200",
        }
      case "pending":
      case "in review":
      case "waiting":
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          className: "bg-blue-100 text-blue-800 border-blue-200",
        }
      case "warning":
      case "attention":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          className: "bg-amber-100 text-amber-800 border-amber-200",
        }
      case "draft":
        return {
          icon: <HelpCircle className="h-3.5 w-3.5" />,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        }
      default:
        return {
          icon: <HelpCircle className="h-3.5 w-3.5" />,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        }
    }
  }

  const { icon, className: statusClassName } = getStatusConfig()

  const sizeClasses = {
    small: "text-xs py-0.5 px-2",
    default: "text-xs py-1 px-2.5",
    large: "text-sm py-1 px-3",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        sizeClasses[size],
        statusClassName,
        className,
      )}
      {...props}
    >
      {showIcon && icon}
      {status}
    </span>
  )
}

export default StatusBadge