"use client"

import { Button } from "@/components/dashboard/student/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/student/ui/dialog"
import { CheckCircle } from "lucide-react"

export function SubmissionSuccessDialog({ open, onOpenChange, onDone }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Submission Successful</DialogTitle>
          <DialogDescription className="text-center">
            Your event proposal has been submitted successfully. You will be notified once a decision has been made.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onDone} className="bg-green-600 hover:bg-green-700">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
