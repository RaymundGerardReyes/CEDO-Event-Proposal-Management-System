// SubmitReportDialog.jsx
"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dashboard/student/ui/alert-dialog"
import { ClipboardCheck } from "lucide-react"

export function SubmitReportDialog({ open, onOpenChange, onSubmit }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-500" />
            Event Report Submitted
          </AlertDialogTitle>
          <AlertDialogDescription>
            Thank you for submitting your event report. Your information has been recorded and will be reviewed by our
            team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onSubmit} className="bg-green-600 hover:bg-green-700">
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
