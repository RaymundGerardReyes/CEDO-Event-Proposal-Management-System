"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import { AlertCircle, CalendarIcon, InfoIcon, LockIcon, Upload } from "lucide-react"
import { useState } from "react"

export const Section3_SchoolEvent = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleCheckboxChange,
  onNext,
  onPrevious,
  onWithdraw,
  disabled = false,
}) => {
  const [fileErrors, setFileErrors] = useState({
    schoolGPOAFile: "",
    schoolProposalFile: "",
  })

  // Direct input change handler that properly passes the event object
  const onInputChange = (e) => {
    if (disabled) return
    handleInputChange(e)
  }

  const handleDateChange = (field, date) => {
    if (disabled) return
    // Create a synthetic event object that matches the expected format
    handleInputChange({
      target: {
        name: field,
        value: date,
      },
    })
  }

  const handleTargetAudienceChange = (audience, checked) => {
    if (disabled) return

    const currentAudiences = formData.schoolTargetAudience || []
    let newAudiences

    if (checked) {
      newAudiences = [...currentAudiences, audience]
    } else {
      newAudiences = currentAudiences.filter((item) => item !== audience)
    }

    // Create a synthetic event object that matches the expected format
    handleInputChange({
      target: {
        name: "schoolTargetAudience",
        value: newAudiences,
      },
    })
  }

  const handleRadioChange = (name, value) => {
    if (disabled) return
    // Create a synthetic event object that matches the expected format
    handleInputChange({
      target: {
        name: name,
        value: value,
      },
    })
  }

  const validateFile = (file, type) => {
    if (!file) return true

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformatss-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      return "File must be PDF, Word, or Excel format"
    }

    // Check file name format
    const orgName = formData.organizationName || ""
    const fileName = file.name.toLowerCase()

    if (type === "gpoa" && !fileName.includes("gpoa")) {
      return "File name must include 'GPOA'"
    }

    if (type === "proposal" && !fileName.includes("pp")) {
      return "File name must include 'PP'"
    }

    return ""
  }

  const handleFileUpload = (e, fileType) => {
    if (disabled) return

    const file = e.target.files[0]
    if (!file) return

    const error = validateFile(file, fileType)
    setFileErrors((prev) => ({ ...prev, [e.target.name]: error }))

    if (!error) {
      handleFileChange(e)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Section 3 of 5: School-Based Event Details</CardTitle>
            <CardDescription>Provide details about your school-based event</CardDescription>
          </div>
          {disabled && (
            <div className="flex items-center text-amber-600">
              <LockIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Read-only</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.proposalStatus === "denied" && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-800">Revision Requested</AlertTitle>
            <AlertDescription className="text-orange-700">
              {formData.adminComments ||
                "The admin has requested revisions to your event proposal. Please update the required information and resubmit."}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="schoolEventName" className="flex items-center">
              Event/Activity Name <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="schoolEventName"
              name="schoolEventName"
              value={formData.schoolEventName || ""}
              onChange={onInputChange}
              placeholder="Enter event name"
              className="mt-1"
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="schoolVenue" className="flex items-center">
              Venue (Platform or Address) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="schoolVenue"
              name="schoolVenue"
              value={formData.schoolVenue || ""}
              onChange={onInputChange}
              placeholder="Enter venue"
              className="mt-1"
              disabled={disabled}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center">
                Start Date <span className="text-red-500 ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.schoolStartDate ? format(formData.schoolStartDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.schoolStartDate}
                    onSelect={(date) => handleDateChange("schoolStartDate", date)}
                    initialFocus
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="flex items-center">
                End Date <span className="text-red-500 ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.schoolEndDate ? format(formData.schoolEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.schoolEndDate}
                    onSelect={(date) => handleDateChange("schoolEndDate", date)}
                    initialFocus
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolTimeStart" className="flex items-center">
                Start Time <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="schoolTimeStart"
                name="schoolTimeStart"
                type="time"
                value={formData.schoolTimeStart || ""}
                onChange={onInputChange}
                className="mt-1"
                disabled={disabled}
                required
              />
            </div>

            <div>
              <Label htmlFor="schoolTimeEnd" className="flex items-center">
                End Time <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="schoolTimeEnd"
                name="schoolTimeEnd"
                type="time"
                value={formData.schoolTimeEnd || ""}
                onChange={onInputChange}
                className="mt-1"
                disabled={disabled}
                required
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center">
              Type of Event <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup
              value={formData.schoolEventType || ""}
              onValueChange={(value) => handleRadioChange("schoolEventType", value)}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="academic" id="school-academic" disabled={disabled} />
                <Label htmlFor="school-academic">Academic Enhancement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="workshop" id="school-workshop" disabled={disabled} />
                <Label htmlFor="school-workshop">Workshop / Seminar / Webinar</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center">
              Target Audience <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Leaders", "Alumni"].map((audience) => (
                <div className="flex items-center space-x-2" key={audience}>
                  <Checkbox
                    id={`school-audience-${audience}`}
                    checked={formData.schoolTargetAudience?.includes(audience) || false}
                    onCheckedChange={(checked) => {
                      if (!disabled) {
                        handleTargetAudienceChange(audience, checked)
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`school-audience-${audience}`}>{audience}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="flex items-center">
              Mode of Event <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup
              value={formData.schoolEventMode || ""}
              onValueChange={(value) => handleRadioChange("schoolEventMode", value)}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offline" id="school-offline" disabled={disabled} />
                <Label htmlFor="school-offline">Offline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="school-online" disabled={disabled} />
                <Label htmlFor="school-online">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="school-hybrid" disabled={disabled} />
                <Label htmlFor="school-hybrid">Hybrid</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center">
              Number of Return Service Credits <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup
              value={formData.schoolReturnServiceCredit || ""}
              onValueChange={(value) => handleRadioChange("schoolReturnServiceCredit", value)}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="school-credit-1" disabled={disabled} />
                <Label htmlFor="school-credit-1">1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="school-credit-2" disabled={disabled} />
                <Label htmlFor="school-credit-2">2</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center">
              Attach General Plan of Action (GPOA) <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="mt-1">
              <Label htmlFor="schoolGPOAFile" className={`cursor-pointer ${disabled ? "opacity-70" : ""}`}>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 sm:p-6 flex flex-col items-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <span className="mt-2 text-xs sm:text-sm text-gray-500">
                    {formData.schoolGPOAFile ? formData.schoolGPOAFile.name : "Click to upload file"}
                  </span>
                  <span className="mt-1 text-xs text-gray-400 text-center">
                    Allowed formats: PDF, Excel, Word
                    <br />
                    File name: OrganizationName_GPOA
                  </span>
                </div>
                <Input
                  id="schoolGPOAFile"
                  name="schoolGPOAFile"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "gpoa")}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                />
              </Label>
              {fileErrors.schoolGPOAFile && <p className="text-sm text-red-500 mt-1">{fileErrors.schoolGPOAFile}</p>}
            </div>
          </div>

          <div>
            <Label className="flex items-center">
              Attach Project Proposal <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="mt-1">
              <Label htmlFor="schoolProposalFile" className={`cursor-pointer ${disabled ? "opacity-70" : ""}`}>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 sm:p-6 flex flex-col items-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <span className="mt-2 text-xs sm:text-sm text-gray-500">
                    {formData.schoolProposalFile ? formData.schoolProposalFile.name : "Click to upload file"}
                  </span>
                  <span className="mt-1 text-xs text-gray-400 text-center">
                    Must include: summary, objectives, goals, timeline, detailed program flow, budget
                    <br />
                    Allowed formats: PDF, Excel, Word
                    <br />
                    File name: OrganizationName_PP
                  </span>
                </div>
                <Input
                  id="schoolProposalFile"
                  name="schoolProposalFile"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "proposal")}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                />
              </Label>
              {fileErrors.schoolProposalFile && (
                <p className="text-sm text-red-500 mt-1">{fileErrors.schoolProposalFile}</p>
              )}
            </div>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <p className="text-sm">
              All fields marked with <span className="text-red-500">*</span> are required. Make sure to upload all
              required documents before proceeding.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrevious} disabled={disabled}>
            Back
          </Button>
          {!disabled && (
            <Button variant="outline" onClick={onWithdraw} className="border-red-200 text-red-600 hover:bg-red-50">
              Withdraw
            </Button>
          )}
        </div>
        <Button
          onClick={onNext}
          disabled={disabled}
          className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto mt-2 sm:mt-0"
        >
          Save & Continue
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Section3_SchoolEvent
