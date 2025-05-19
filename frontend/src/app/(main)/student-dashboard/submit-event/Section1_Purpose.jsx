"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

export const Section1_Purpose = ({ formData = {}, onChange, errors = {} }) => {
  const [purpose, setPurpose] = useState(formData.purpose || "")

  const handlePurposeChange = (value) => {
    setPurpose(value)
    onChange({ purpose: value })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Section 1 of 5: Overview & Requirements</CardTitle>
        <CardDescription>Let us know what you're here to do</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">I am here to...</h3>
          <RadioGroup value={purpose} onValueChange={handlePurposeChange} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50">
              <RadioGroupItem value="submit_event" id="submit_event" className="mt-1" />
              <div>
                <Label htmlFor="submit_event" className="text-base font-medium">
                  Submit Event Approval Form
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Complete this form to request approval for a school or community event
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 opacity-60">
              <RadioGroupItem value="submit_report" id="submit_report" disabled className="mt-1" />
              <div>
                <Label htmlFor="submit_report" className="text-base font-medium">
                  Submit Accomplishment Report
                </Label>
                <p className="text-sm text-gray-500 mt-1">Available after your event proposal has been approved</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Alert className="bg-blue-50 border-blue-200 mt-6">
          <CheckCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <p className="font-medium">Important Information:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
              <li>Complete Sections 1-4 in order</li>
              <li>Sections remain editable until "Approved" status is granted</li>
              <li>Section 5 becomes available only after Section 4 approval</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={() => {}}
          disabled={!purpose}
          className={`${!purpose ? "opacity-50 cursor-not-allowed" : ""} bg-blue-600 hover:bg-blue-700 text-white`}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Section1_Purpose
