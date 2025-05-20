"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function PhasePurpose({ formData, onSubmit, isEditable = true }) {
  const [purpose, setPurpose] = useState(formData.purpose || "")
  const [error, setError] = useState("")

  useEffect(() => {
    if (formData.purpose) {
      setPurpose(formData.purpose)
    }
  }, [formData])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!purpose) {
      setError("Please select a purpose")
      return
    }

    onSubmit({ purpose })
  }

  return (
    <form id="phase-0-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-cedo-blue mb-2">Select Purpose</h3>
          <p className="text-sm text-muted-foreground mb-4">Please select the purpose of your submission</p>
        </div>

        <RadioGroup value={purpose} onValueChange={setPurpose} className="space-y-4" disabled={!isEditable}>
          <div className="flex items-start space-x-2 border rounded-md p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="documentation" id="documentation" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="documentation" className="text-base font-medium cursor-pointer">
                Submit Documentation & Accomplishment Reports
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose this option if you want to submit documentation and accomplishment reports for a completed event
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2 border rounded-md p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="event_approval" id="event_approval" className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="event_approval" className="text-base font-medium cursor-pointer">
                Submit Event Approval Form
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose this option if you want to submit a new event for approval
              </p>
            </div>
          </div>
        </RadioGroup>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  )
}
