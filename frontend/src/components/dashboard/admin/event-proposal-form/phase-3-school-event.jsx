"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export function PhaseSchoolEvent({ formData, onSubmit, isEditable = true }) {
  const [formState, setFormState] = useState({
    description: formData.description || "",
    eventName: formData.eventName || "",
    venue: formData.venue || "",
    startDate: formData.startDate || "",
    endDate: formData.endDate || "",
    startTime: formData.startTime || "",
    endTime: formData.endTime || "",
    eventType: formData.eventType || "",
    targetAudience: formData.targetAudience || "",
    eventMode: formData.eventMode || "",
    serviceCredits: formData.serviceCredits || "",
    gpoaFile: formData.gpoaFile || null,
    proposalFile: formData.proposalFile || null,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormState({
      description: formData.description || "",
      eventName: formData.eventName || "",
      venue: formData.venue || "",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      startTime: formData.startTime || "",
      endTime: formData.endTime || "",
      eventType: formData.eventType || "",
      targetAudience: formData.targetAudience || "",
      eventMode: formData.eventMode || "",
      serviceCredits: formData.serviceCredits || "",
      gpoaFile: formData.gpoaFile || null,
      proposalFile: formData.proposalFile || null,
    })
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name, date) => {
    setFormState((prev) => ({ ...prev, [name]: date }))
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormState((prev) => ({ ...prev, [name]: files[0] }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formState.eventName) newErrors.eventName = "Event name is required"
    if (!formState.venue) newErrors.venue = "Venue is required"
    if (!formState.startDate) newErrors.startDate = "Start date is required"
    if (!formState.endDate) newErrors.endDate = "End date is required"
    if (!formState.startTime) newErrors.startTime = "Start time is required"
    if (!formState.endTime) newErrors.endTime = "End time is required"
    if (!formState.eventType) newErrors.eventType = "Event type is required"
    if (!formState.targetAudience) newErrors.targetAudience = "Target audience is required"
    if (!formState.eventMode) newErrors.eventMode = "Event mode is required"
    if (!formState.serviceCredits) newErrors.serviceCredits = "Number of service credits is required"
    if (!formState.gpoaFile && !formData.gpoaFile) newErrors.gpoaFile = "GPOA file is required"
    if (!formState.proposalFile && !formData.proposalFile) newErrors.proposalFile = "Project proposal file is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formState)
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  // Event types
  const eventTypes = [
    { value: "seminar", label: "Seminar/Workshop" },
    { value: "competition", label: "Competition" },
    { value: "conference", label: "Conference" },
    { value: "cultural", label: "Cultural Event" },
    { value: "sports", label: "Sports Event" },
    { value: "fundraising", label: "Fundraising" },
    { value: "community", label: "Community Service" },
    { value: "other", label: "Other" },
  ]

  // Target audience options
  const audienceOptions = [
    { value: "students", label: "Students" },
    { value: "faculty", label: "Faculty" },
    { value: "staff", label: "Staff" },
    { value: "alumni", label: "Alumni" },
    { value: "public", label: "General Public" },
    { value: "mixed", label: "Mixed Audience" },
  ]

  // Event mode options
  const modeOptions = [
    { value: "in_person", label: "In-Person" },
    { value: "virtual", label: "Virtual" },
    { value: "hybrid", label: "Hybrid" },
  ]

  return (
    <form id="phase-2-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Provide additional details about this event"
            value={formState.description}
            onChange={handleChange}
            disabled={!isEditable}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventName" className="required-field">
              Event/Activity Name
            </Label>
            <Input
              id="eventName"
              name="eventName"
              placeholder="Enter event name"
              value={formState.eventName}
              onChange={handleChange}
              disabled={!isEditable}
              className={errors.eventName ? "border-destructive" : ""}
            />
            {errors.eventName && <p className="text-sm text-destructive">{errors.eventName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue" className="required-field">
              Venue
            </Label>
            <Input
              id="venue"
              name="venue"
              placeholder="Enter event venue"
              value={formState.venue}
              onChange={handleChange}
              disabled={!isEditable}
              className={errors.venue ? "border-destructive" : ""}
            />
            {errors.venue && <p className="text-sm text-destructive">{errors.venue}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="required-field">
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="startDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formState.startDate && "text-muted-foreground",
                    errors.startDate && "border-destructive",
                  )}
                  disabled={!isEditable}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formState.startDate ? format(new Date(formState.startDate), "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formState.startDate ? new Date(formState.startDate) : undefined}
                  onSelect={(date) => handleDateChange("startDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="required-field">
              End Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formState.endDate && "text-muted-foreground",
                    errors.endDate && "border-destructive",
                  )}
                  disabled={!isEditable}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formState.endDate ? format(new Date(formState.endDate), "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formState.endDate ? new Date(formState.endDate) : undefined}
                  onSelect={(date) => handleDateChange("endDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="required-field">
              Start Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formState.startTime}
                onChange={handleChange}
                disabled={!isEditable}
                className={cn("pl-10", errors.startTime && "border-destructive")}
              />
            </div>
            {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime" className="required-field">
              End Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formState.endTime}
                onChange={handleChange}
                disabled={!isEditable}
                className={cn("pl-10", errors.endTime && "border-destructive")}
              />
            </div>
            {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventType" className="required-field">
              Type of Event
            </Label>
            <Select
              value={formState.eventType}
              onValueChange={(value) => handleSelectChange("eventType", value)}
              disabled={!isEditable}
            >
              <SelectTrigger id="eventType" className={errors.eventType ? "border-destructive" : ""}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventType && <p className="text-sm text-destructive">{errors.eventType}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="required-field">
              Target Audience
            </Label>
            <Select
              value={formState.targetAudience}
              onValueChange={(value) => handleSelectChange("targetAudience", value)}
              disabled={!isEditable}
            >
              <SelectTrigger id="targetAudience" className={errors.targetAudience ? "border-destructive" : ""}>
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetAudience && <p className="text-sm text-destructive">{errors.targetAudience}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventMode" className="required-field">
              Mode of Event
            </Label>
            <Select
              value={formState.eventMode}
              onValueChange={(value) => handleSelectChange("eventMode", value)}
              disabled={!isEditable}
            >
              <SelectTrigger id="eventMode" className={errors.eventMode ? "border-destructive" : ""}>
                <SelectValue placeholder="Select event mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventMode && <p className="text-sm text-destructive">{errors.eventMode}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceCredits" className="required-field">
              Number of Return Service Credits
            </Label>
            <Input
              id="serviceCredits"
              name="serviceCredits"
              type="number"
              placeholder="Enter number of credits"
              value={formState.serviceCredits}
              onChange={handleChange}
              disabled={!isEditable}
              className={errors.serviceCredits ? "border-destructive" : ""}
            />
            {errors.serviceCredits && <p className="text-sm text-destructive">{errors.serviceCredits}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gpoaFile" className="required-field">
              Upload GPOA
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="gpoaFile"
                name="gpoaFile"
                type="file"
                onChange={handleFileChange}
                disabled={!isEditable}
                className={errors.gpoaFile ? "border-destructive" : ""}
                accept=".pdf,.doc,.docx"
              />
              {formData.gpoaFile && (
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  <Upload className="h-4 w-4 mr-2" />
                  View File
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload your General Plan of Activities (PDF, DOC, DOCX)</p>
            {errors.gpoaFile && <p className="text-sm text-destructive">{errors.gpoaFile}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposalFile" className="required-field">
              Upload Project Proposal
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="proposalFile"
                name="proposalFile"
                type="file"
                onChange={handleFileChange}
                disabled={!isEditable}
                className={errors.proposalFile ? "border-destructive" : ""}
                accept=".pdf,.doc,.docx"
              />
              {formData.proposalFile && (
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  <Upload className="h-4 w-4 mr-2" />
                  View File
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload your detailed project proposal (PDF, DOC, DOCX)</p>
            {errors.proposalFile && <p className="text-sm text-destructive">{errors.proposalFile}</p>}
          </div>
        </div>
      </div>
    </form>
  )
}
