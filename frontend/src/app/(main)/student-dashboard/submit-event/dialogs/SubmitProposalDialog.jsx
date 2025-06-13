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
import { ClipboardCheck, Loader2 } from "lucide-react"

export function SubmitProposalDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cedo-blue/10 mb-4">
            <ClipboardCheck className="h-6 w-6 text-cedo-blue" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl">Submit Event Proposal</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to submit your event proposal for review? Once submitted, you won't be able to make
            changes until a decision is made.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 p-4 rounded-md my-4 border border-amber-200">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Before you submit:</h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
            <li>Verify all required information is complete and accurate</li>
            <li>Ensure all uploaded documents are correct</li>
            <li>Check that event dates and times are accurate</li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-cedo-blue hover:bg-cedo-blue/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proposal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
