"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CheckCircle, AlertCircle, LockIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const Section5_Reporting = ({
  formData,
  updateFormData,
  onSubmit,
  onPrevious,
  disabled = false,
  sectionsComplete,
}) => {
  const [errors, setErrors] = useState({})
  const [isValid, setIsValid] = useState(false)
  const [file, setFile] = useState(null)
  const [signature, setSignature] = useState(null)
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureComplete, setSignatureComplete] = useState(false)

  // Check if proposal is approved
  const isProposalApproved = formData.proposalStatus === "approved"

  // Get event details from the approved proposal
  const eventName = formData.organizationTypes?.includes("school-based")
    ? formData.schoolEventName
    : formData.communityEventName

  const eventVenue = formData.organizationTypes?.includes("school-based")
    ? formData.schoolVenue
    : formData.communityVenue

  const eventStartDate = formData.organizationTypes?.includes("school-based")
    ? formData.schoolStartDate
    : formData.communityStartDate

  const eventEndDate = formData.organizationTypes?.includes("school-based")
    ? formData.schoolEndDate
    : formData.communityEndDate

  // Handle file upload
  const handleFileChange = (e) => {
    if (disabled) return

    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Check file format (PDF or DOCX)
      const validFormats = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validFormats.includes(selectedFile.type)) {
        setErrors((prev) => ({
          ...prev,
          file: "File must be in PDF or DOCX format",
        }))
        return
      }

      // Check file naming convention
      const orgName = formData.organizationName || ""
      const expectedPrefix = orgName.replace(/\s+/g, "") + "_AR"
      const fileName = selectedFile.name

      if (!fileName.startsWith(expectedPrefix)) {
        setErrors((prev) => ({
          ...prev,
          file: `File name must follow format: ${expectedPrefix}`,
        }))
        return
      }

      setFile(selectedFile)
      updateFormData({ accomplishmentReport: selectedFile.name })
      setErrors((prev) => ({ ...prev, file: null }))
    }
  }

  // Signature pad functions
  const startDrawing = (e) => {
    if (disabled) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || disabled) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000"

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const endDrawing = () => {
    if (disabled) return

    setIsDrawing(false)
    const canvas = canvasRef.current
    const signatureData = canvas.toDataURL()
    setSignature(signatureData)
    updateFormData({ signature: signatureData })
    setSignatureComplete(true)
  }

  const clearSignature = () => {
    if (disabled) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
    setSignatureComplete(false)
    updateFormData({ signature: null })
  }

  // Validate the form
  useEffect(() => {
    const newErrors = {}

    if (!formData.accomplishmentReport) {
      newErrors.file = "Please upload your Accomplishment Report"
    }

    if (!signature) {
      newErrors.signature = "Please sign to approve this form"
    }

    if (!formData.attendanceCount?.trim()) {
      newErrors.attendanceCount = "Attendance count is required"
    }

    if (!formData.eventStatus?.trim()) {
      newErrors.eventStatus = "Event status is required"
    }

    setErrors(newErrors)
    setIsValid(Object.keys(newErrors).length === 0 && isProposalApproved)
  }, [formData, signature, isProposalApproved])

  const handleSubmit = () => {
    if (isValid) {
      onSubmit()
    }
  }

  const handleInputChange = (e) => {
    if (disabled) return

    const { name, value } = e.target
    updateFormData({ [name]: value })
  }

  if (!isProposalApproved) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Section 5 of 5: Documentation & Accomplishment Reports</CardTitle>
          <CardDescription>Upload your documentation and sign to complete your submission</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Section Locked</AlertTitle>
            <AlertDescription>
              <p>This section is locked until your event proposal is approved.</p>
              <p className="mt-2">Please complete and submit Sections 2-4 first.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Section 5 of 5: Documentation & Accomplishment Reports</CardTitle>
            <CardDescription>Upload your documentation and sign to complete your submission</CardDescription>
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
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Approved Event Details (Read-only)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Organization Name</Label>
              <p className="text-gray-700">{formData.organizationName || "N/A"}</p>
            </div>
            <div>
              <Label>Event Name</Label>
              <p className="text-gray-700">{eventName || "N/A"}</p>
            </div>
            <div>
              <Label>Venue</Label>
              <p className="text-gray-700">{eventVenue || "N/A"}</p>
            </div>
            <div>
              <Label>Event Dates</Label>
              <p className="text-gray-700">
                {eventStartDate && eventEndDate
                  ? `${new Date(eventStartDate).toLocaleDateString()} - ${new Date(eventEndDate).toLocaleDateString()}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="reportDescription"
              placeholder="Additional notes about your documentation"
              value={formData.reportDescription || ""}
              onChange={handleInputChange}
              className="min-h-[100px]"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendanceCount" className="flex items-center">
                Number of Attendees <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="attendanceCount"
                name="attendanceCount"
                type="number"
                value={formData.attendanceCount || ""}
                onChange={handleInputChange}
                placeholder="Enter number of attendees"
                className="mt-1"
                disabled={disabled}
                required
              />
              {errors.attendanceCount && <p className="text-sm text-red-500 mt-1">{errors.attendanceCount}</p>}
            </div>

            <div>
              <Label htmlFor="eventStatus" className="flex items-center">
                Event Status <span className="text-red-500 ml-1">*</span>
              </Label>
              <select
                id="eventStatus"
                name="eventStatus"
                value={formData.eventStatus || ""}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1"
                disabled={disabled}
                required
              >
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
              {errors.eventStatus && <p className="text-sm text-red-500 mt-1">{errors.eventStatus}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="flex items-center">
              Attach Documentation and Accomplishment Reports <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-sm text-gray-500">
              Must be in PDF or DOCS file format. File name format: OrganizationName_AR
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="max-w-md"
                disabled={disabled}
              />
              {file && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
          </div>

          <div className="space-y-2 pt-4">
            <Label className="flex items-center">
              Digital Signature <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-sm text-gray-500">Sign below to approve and submit this form</p>

            <div className="border border-gray-300 rounded-md p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="border border-gray-200 rounded w-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                style={{ backgroundColor: "#f9f9f9" }}
                disabled={disabled}
              />
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearSignature} disabled={disabled}>
                Clear Signature
              </Button>
            </div>

            {errors.signature && <p className="text-sm text-red-500">{errors.signature}</p>}

            {signatureComplete && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Signature captured</AlertTitle>
                <AlertDescription>Your digital signature has been recorded.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={disabled}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || disabled}
          className={!isValid || disabled ? "opacity-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
        >
          Submit Report for Approval <CheckCircle className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Section5_Reporting
