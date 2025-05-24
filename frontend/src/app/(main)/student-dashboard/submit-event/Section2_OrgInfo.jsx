"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

const Section2_OrgInfo = ({ formData, onChange, onNext, onPrevious, onWithdraw, errors, disabled }) => {
  const [localFormData, setLocalFormData] = useState({
    organizationName: "",
    organizationTypes: [],
    organizationDescription: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    ...formData,
  })

  const [localErrors, setLocalErrors] = useState({})

  useEffect(() => {
    // Update local form data when formData changes
    setLocalFormData((prev) => ({
      ...prev,
      ...formData,
    }))
  }, [formData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLocalFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear local error for this field immediately
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }

    // Update parent form data immediately to ensure it's always in sync
    onChange({ [name]: value })
  }

  const handleCheckboxChange = (type) => {
    setLocalFormData((prev) => {
      const currentTypes = prev.organizationTypes || []
      const newTypes = currentTypes.includes(type) ? currentTypes.filter((t) => t !== type) : [...currentTypes, type]

      // Clear organization types error if at least one type is selected
      if (newTypes.length > 0 && localErrors.organizationTypes) {
        setLocalErrors((prev) => {
          const updated = { ...prev }
          delete updated.organizationTypes
          return updated
        })
      }

      // Update parent form data immediately
      onChange({ organizationTypes: newTypes })

      return {
        ...prev,
        organizationTypes: newTypes,
      }
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!localFormData.organizationName?.trim()) {
      newErrors.organizationName = "Organization name is required"
    }

    if (!localFormData.organizationTypes?.length) {
      newErrors.organizationTypes = "At least one organization type must be selected"
    }

    if (!localFormData.contactName?.trim()) {
      newErrors.contactName = "Contact name is required"
    }

    if (!localFormData.contactEmail?.trim()) {
      newErrors.contactEmail = "Contact email is required"
    } else if (!/\S+@\S+\.\S+/.test(localFormData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format"
    }

    setLocalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = (e) => {
    e.preventDefault()

    // First update parent with the latest form data to ensure sync
    onChange(localFormData)

    // Then validate
    if (validateForm()) {
      // If validation passes, explicitly clear any validation errors in parent
      onChange({ validationErrors: {} })
      onNext()
    } else {
      // If validation fails, update parent with validation errors
      onChange({ validationErrors: localErrors })
    }
  }

  const handlePrevious = () => {
    // Update parent form data before going back
    onChange(localFormData)
    onPrevious()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Organization Information</CardTitle>
        <CardDescription>
          Please provide details about your organization and the primary contact person.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationName" className="text-base">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                value={localFormData.organizationName || ""}
                onChange={handleInputChange}
                placeholder="Enter your organization's name"
                className={`mt-1 ${localErrors.organizationName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                disabled={disabled}
                required
              />
              {localErrors.organizationName && (
                <p className="text-red-500 text-sm mt-1">{localErrors.organizationName}</p>
              )}
            </div>

            <div>
              <Label className="text-base mb-2 block">
                Type of Organization <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="school-based"
                    checked={localFormData.organizationTypes?.includes("school-based") || false}
                    onCheckedChange={() => handleCheckboxChange("school-based")}
                    disabled={disabled}
                  />
                  <Label htmlFor="school-based" className="font-normal">
                    School-based
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="community-based"
                    checked={localFormData.organizationTypes?.includes("community-based") || false}
                    onCheckedChange={() => handleCheckboxChange("community-based")}
                    disabled={disabled}
                  />
                  <Label htmlFor="community-based" className="font-normal">
                    Community-based
                  </Label>
                </div>
              </div>
              {localErrors.organizationTypes && (
                <p className="text-red-500 text-sm mt-1">{localErrors.organizationTypes}</p>
              )}
            </div>

            <div>
              <Label htmlFor="organizationDescription" className="text-base">
                Organization Description
              </Label>
              <Textarea
                id="organizationDescription"
                name="organizationDescription"
                value={localFormData.organizationDescription || ""}
                onChange={handleInputChange}
                placeholder="Briefly describe your organization"
                className="mt-1"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName" className="text-base">
                  Contact Person <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={localFormData.contactName || ""}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className={`mt-1 ${localErrors.contactName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  disabled={disabled}
                  required
                />
                {localErrors.contactName && <p className="text-red-500 text-sm mt-1">{localErrors.contactName}</p>}
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-base">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={localFormData.contactEmail || ""}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className={`mt-1 ${localErrors.contactEmail ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  disabled={disabled}
                  required
                />
                {localErrors.contactEmail && <p className="text-red-500 text-sm mt-1">{localErrors.contactEmail}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-base">
                Phone Number
              </Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={localFormData.contactPhone || ""}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="mt-1"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={disabled}>
              Previous
            </Button>
            <div className="flex gap-2">
              {!disabled && (
                <Button type="button" variant="destructive" onClick={onWithdraw}>
                  Withdraw
                </Button>
              )}
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={disabled}>
                Save & Continue
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Section2_OrgInfo
