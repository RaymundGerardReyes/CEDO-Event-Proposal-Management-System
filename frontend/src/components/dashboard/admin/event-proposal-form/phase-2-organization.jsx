"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PhaseOrganization({ formData, onSubmit, isEditable = true }) {
  const [formState, setFormState] = useState({
    description: formData.description || "",
    orgType: formData.orgType || "",
    orgName: formData.orgName || "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormState({
      description: formData.description || "",
      orgType: formData.orgType || "",
      orgName: formData.orgName || "",
    })
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formState.orgType) {
      newErrors.orgType = "Organization type is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formState)
    }
  }

  // Organization types
  const orgTypes = [
    { value: "academic", label: "Academic Organization" },
    { value: "cultural", label: "Cultural Organization" },
    { value: "sports", label: "Sports Organization" },
    { value: "religious", label: "Religious Organization" },
    { value: "community", label: "Community Service Organization" },
    { value: "professional", label: "Professional Organization" },
    { value: "other", label: "Other" },
  ]

  return (
    <form id="phase-1-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Provide a brief description of your organization"
            value={formState.description}
            onChange={handleChange}
            disabled={!isEditable}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgType" className="required-field">
            Type of Organization
          </Label>
          <Select
            value={formState.orgType}
            onValueChange={(value) => handleSelectChange("orgType", value)}
            disabled={!isEditable}
          >
            <SelectTrigger id="orgType" className={errors.orgType ? "border-destructive" : ""}>
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              {orgTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.orgType && <p className="text-sm text-destructive">{errors.orgType}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgName">Name of Organization</Label>
          <Input
            id="orgName"
            name="orgName"
            placeholder="Enter your organization's name"
            value={formState.orgName}
            onChange={handleChange}
            disabled={!isEditable}
          />
        </div>
      </div>
    </form>
  )
}
