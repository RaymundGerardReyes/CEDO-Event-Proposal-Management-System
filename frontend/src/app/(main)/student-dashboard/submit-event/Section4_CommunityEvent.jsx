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

const Section4_CommunityEvent = ({
  formData = {}, // Provide a default value to avoid undefined errors
  handleInputChange,
  handleFileChange,
  handleCheckboxChange,
  onSubmit,
  onPrevious,
  onWithdraw,
  disabled = false,
}) => {
  const [fileErrors, setFileErrors] = useState({
    communityGPOAFile: "",
    communityProposalFile: "",
  })

  const handleDateChange = (field, date) => {
    if (disabled) return
    handleInputChange({ target: { name: field, value: date } })
  }

  const handleTargetAudienceChange = (audience, checked) => {
    if (disabled) return

    const currentAudiences = formData.communityTargetAudience || []
    let newAudiences

    if (checked) {
      newAudiences = [...currentAudiences, audience]
    } else {
      newAudiences = currentAudiences.filter((item) => item !== audience)
    }

    handleInputChange({ target: { name: "communityTargetAudience", value: newAudiences } })
  }

  const validateFile = (file, type) => {
    if (!file) return true

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    return ""
  }

  const handleFileValidation = (e) => {
    if (disabled) return

    const { name, files } = e.target
    const file = files[0]

    let errorMessage = ""
    if (name === "communityGPOAFile") {
      errorMessage = validateFile(file, "gpoa")
    } else if (name === "communityProposalFile") {
      errorMessage = validateFile(file, "proposal")
    }

    setFileErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }))

    if (!errorMessage) {
      handleFileChange(e)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Section 4 of 5: Community-Based Event Details</CardTitle>
            <CardDescription>Provide details about your community-based event</CardDescription>
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
            <Label htmlFor="communityEventName" className="flex items-center">
              Event/Activity Name <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="communityEventName"
              name="communityEventName"
              value={formData.communityEventName || ""}
              onChange={handleInputChange}
              placeholder="Enter event name"
              className="mt-1"
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="communityVenue" className="flex items-center">
              Venue (Platform or Address) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="communityVenue"
              name="communityVenue"
              value={formData.communityVenue || ""}
              onChange={handleInputChange}
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
                    {formData.communityStartDate ? format(formData.communityStartDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.communityStartDate}
                    onSelect={(date) => handleDateChange("communityStartDate", date)}
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
                    {formData.communityEndDate ? format(formData.communityEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.communityEndDate}
                    onSelect={(date) => handleDateChange("communityEndDate", date)}
                    initialFocus
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="communityTimeStart" className="flex items-center">
                Time Start <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="communityTimeStart"
                name="communityTimeStart"
                type="time"
                value={formData.communityTimeStart || ""}
                onChange={handleInputChange}
                className="mt-1"
                disabled={disabled}
                required
              />
            </div>

            <div>
              <Label htmlFor="communityTimeEnd" className="flex items-center">
                Time End <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="communityTimeEnd"
                name="communityTimeEnd"
                type="time"
                value={formData.communityTimeEnd || ""}
                onChange={handleInputChange}
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
              value={formData.communityEventType}
              onValueChange={(value) => handleInputChange({ target: { name: "communityEventType", value } })}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="academic" id="community-academic" disabled={disabled} />
                <Label htmlFor="community-academic">Academic Enhancement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seminar" id="community-seminar" disabled={disabled} />
                <Label htmlFor="community-seminar">Seminar/Webinar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assembly" id="community-assembly" disabled={disabled} />
                <Label htmlFor="community-assembly">General Assembly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leadership" id="community-leadership" disabled={disabled} />
                <Label htmlFor="community-leadership">Leadership Training</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="community-other" disabled={disabled} />
                <Label htmlFor="community-other">Others</Label>
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
                    id={`community-audience-${audience}`}
                    checked={formData.communityTargetAudience?.includes(audience) || false}
                    onCheckedChange={(checked) => {
                      if (!disabled) {
                        handleTargetAudienceChange(audience, checked)
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`community-audience-${audience}`}>{audience}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="flex items-center">
              Mode of Event <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup
              value={formData.communityEventMode}
              onValueChange={(value) => handleInputChange({ target: { name: "communityEventMode", value } })}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offline" id="community-offline" disabled={disabled} />
                <Label htmlFor="community-offline">Offline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="community-online" disabled={disabled} />
                <Label htmlFor="community-online">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="community-hybrid" disabled={disabled} />
                <Label htmlFor="community-hybrid">Hybrid</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center">
              Number of SDP Credits <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup
              value={formData.communitySDPCredits}
              onValueChange={(value) => handleInputChange({ target: { name: "communitySDPCredits", value } })}
              className="space-y-3 mt-2"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="community-credit-1" disabled={disabled} />
                <Label htmlFor="community-credit-1">1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="community-credit-2" disabled={disabled} />
                <Label htmlFor="community-credit-2">2</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center">
              Attach General Plan of Action (GPOA) <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="mt-1">
              <Label htmlFor="communityGPOAFile" className={`cursor-pointer ${disabled ? "opacity-70" : ""}`}>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 sm:p-6 flex flex-col items-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <span className="mt-2 text-xs sm:text-sm text-gray-500">
                    {formData.communityGPOAFile ? formData.communityGPOAFile.name : "Click to upload file"}
                  </span>
                  <span className="mt-1 text-xs text-gray-400 text-center">
                    Allowed formats: PDF, Excel, Word
                    <br />
                    File name: OrganizationName_GPOA
                  </span>
                </div>
                <Input
                  id="communityGPOAFile"
                  name="communityGPOAFile"
                  type="file"
                  className="hidden"
                  onChange={handleFileValidation}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                />
              </Label>
              {fileErrors.communityGPOAFile && (
                <p className="text-sm text-red-500 mt-1">{fileErrors.communityGPOAFile}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="flex items-center">
              Attach Project Proposal <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="mt-1">
              <Label htmlFor="communityProposalFile" className={`cursor-pointer ${disabled ? "opacity-70" : ""}`}>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 sm:p-6 flex flex-col items-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <span className="mt-2 text-xs sm:text-sm text-gray-500">
                    {formData.communityProposalFile ? formData.communityProposalFile.name : "Click to upload file"}
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
                  id="communityProposalFile"
                  name="communityProposalFile"
                  type="file"
                  className="hidden"
                  onChange={handleFileValidation}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                />
              </Label>
              {fileErrors.communityProposalFile && (
                <p className="text-sm text-red-500 mt-1">{fileErrors.communityProposalFile}</p>
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
          onClick={onSubmit}
          disabled={disabled}
          className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto mt-2 sm:mt-0"
        >
          Submit Proposal for Approval
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Section4_CommunityEvent
