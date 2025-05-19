// student/common/LoadingButton.jsx
import { Button } from "@/components/dashboard/student/ui/button"; // Assuming path is correct relative to your project
import { Loader2 } from "lucide-react"

const LoadingButton = ({ children, isLoading = false, loadingText = "Loading...", disabled = false, ...props }) => {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export default LoadingButton