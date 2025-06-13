"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle } from "lucide-react"

export function SubmissionSuccessDialog({ open, onOpenChange, onDone }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl">Submission Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your event proposal has been submitted successfully and is now pending review.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 p-4 rounded-md my-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-blue-600">1</span>
              </span>
              Your proposal will be reviewed by the admin team
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-blue-600">2</span>
              </span>
              You'll receive a notification when a decision is made
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-blue-600">3</span>
              </span>
              If approved, you can proceed with your event and submit a report afterward
            </li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onDone} className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90 text-white">
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
