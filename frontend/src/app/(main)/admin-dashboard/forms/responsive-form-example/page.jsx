"use client"

import { PageHeader } from "@/components/dashboard/admin/page-header"
import { FormActions, FormSection, ResponsiveForm } from "@/components/dashboard/admin/responsive-form"
import {
  CheckboxField,
  DatePickerField,
  InputField,
  RadioField,
  SelectField,
  TextareaField,
} from "@/components/dashboard/admin/responsive-form-field"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import { FormGrid, FormGridItem } from "@/components/dashboard/admin/ui/form-grid"
import { FormValidationMessage, FormValidationSummary } from "@/components/dashboard/admin/ui/form-validation"
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { useState } from "react"

export default function ResponsiveFormExamplePage() {
  const { isMobile } = useMobile()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "us",
    birthDate: "",
    bio: "",
    jobTitle: "",
    department: "",
    startDate: "",
    employmentType: "full-time",
    skills: [],
    agreeTerms: false,
  })

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")
  const [formLayout, setFormLayout] = useState("vertical")

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    handleChange(name)(value)
  }

  const handleCheckboxChange = (name) => (checked) => {
    handleChange(name)(checked)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName) newErrors.firstName = "First name is required"
    if (!formData.lastName) newErrors.lastName = "Last name is required"
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions"
    }

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Reset messages
    setSuccessMessage("")

    // Validate form
    const newErrors = validateForm()
    setErrors(newErrors)

    // If no errors, submit form
    if (Object.keys(newErrors).length === 0) {
      // Simulate API call
      setTimeout(() => {
        console.log("Form submitted:", formData)
        setSuccessMessage("Form submitted successfully!")
        // In a real app, you would send the data to an API here
      }, 1000)
    }
  }

  const countryOptions = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "mx", label: "Mexico" },
    { value: "uk", label: "United Kingdom" },
    { value: "au", label: "Australia" },
  ]

  const stateOptions = [
    { value: "al", label: "Alabama" },
    { value: "ak", label: "Alaska" },
    { value: "az", label: "Arizona" },
    { value: "ca", label: "California" },
    { value: "co", label: "Colorado" },
  ]

  const departmentOptions = [
    { value: "engineering", label: "Engineering" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "hr", label: "Human Resources" },
    { value: "finance", label: "Finance" },
  ]

  const employmentTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "intern", label: "Intern" },
  ]

  return (
    <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Responsive Form Example"
        subtitle="Demonstrates responsive form layouts that adapt to different screen sizes"
      />

      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Employee Information Form</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Layout:</span>
              <Tabs value={formLayout} onValueChange={setFormLayout} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vertical">Vertical</TabsTrigger>
                  <TabsTrigger value="horizontal">Horizontal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <FormValidationMessage
              message={successMessage}
              type="success"
              className="mb-6"
              dismissible
              onDismiss={() => setSuccessMessage("")}
            />
          )}

          {Object.keys(errors).length > 0 && <FormValidationSummary errors={errors} className="mb-6" />}

          <ResponsiveForm onSubmit={handleSubmit}>
            <FormSection title="Personal Information" description="Enter your personal details below">
              <FormGrid cols={{ default: 1, sm: 2 }}>
                <FormGridItem>
                  <InputField
                    label="First Name"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                    layout={formLayout}
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Last Name"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
                    layout={formLayout}
                  />
                </FormGridItem>
              </FormGrid>

              <FormGrid cols={{ default: 1, sm: 2 }}>
                <FormGridItem>
                  <InputField
                    label="Email"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                    layout={formLayout}
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Phone"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    layout={formLayout}
                  />
                </FormGridItem>
              </FormGrid>

              <DatePickerField
                label="Date of Birth"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange("birthDate")}
                layout={formLayout}
              />

              <TextareaField
                label="Bio"
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                layout={formLayout}
              />
            </FormSection>

            <FormSection title="Address" description="Enter your address information">
              <InputField
                label="Street Address"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                layout={formLayout}
              />

              <FormGrid cols={{ default: 1, sm: 2, md: 3 }}>
                <FormGridItem>
                  <InputField
                    label="City"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    layout={formLayout}
                  />
                </FormGridItem>
                <FormGridItem>
                  <SelectField
                    label="State"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange("state")}
                    options={stateOptions}
                    placeholder="Select state"
                    layout={formLayout}
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Zip Code"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    layout={formLayout}
                  />
                </FormGridItem>
              </FormGrid>

              <SelectField
                label="Country"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange("country")}
                options={countryOptions}
                layout={formLayout}
              />
            </FormSection>

            <FormSection title="Employment Information" description="Enter your employment details">
              <FormGrid cols={{ default: 1, sm: 2 }}>
                <FormGridItem>
                  <InputField
                    label="Job Title"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    layout={formLayout}
                  />
                </FormGridItem>
                <FormGridItem>
                  <SelectField
                    label="Department"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange("department")}
                    options={departmentOptions}
                    placeholder="Select department"
                    layout={formLayout}
                  />
                </FormGridItem>
              </FormGrid>

              <DatePickerField
                label="Start Date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange("startDate")}
                layout={formLayout}
              />

              <RadioField
                label="Employment Type"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange("employmentType")}
                options={employmentTypeOptions}
                orientation={isMobile ? "vertical" : "horizontal"}
                layout={formLayout}
              />
            </FormSection>

            <FormSection title="Terms and Conditions">
              <CheckboxField
                label="I agree to the terms and conditions"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleCheckboxChange("agreeTerms")}
                error={errors.agreeTerms}
              />
            </FormSection>

            <FormActions>
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="bg-cedo-blue hover:bg-cedo-blue/90">
                Submit
              </Button>
            </FormActions>
          </ResponsiveForm>
        </CardContent>
      </Card>
    </div>
  )
}
