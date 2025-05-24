"use client"

import { FormWizard } from "@/components/dashboard/admin/form-wizard"
import { PageHeader } from "@/components/dashboard/admin/page-header"
import { FormSection, ResponsiveForm } from "@/components/dashboard/admin/responsive-form"
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
import { FormValidationMessage } from "@/components/dashboard/admin/ui/form-validation"
import { useState } from "react"

export default function MultiStepFormExamplePage() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({})
  const [step1Data, setStep1Data] = useState({})
  const [step1Errors, setStep1Errors] = useState({})
  const [step2Data, setStep2Data] = useState({})
  const [step2Errors, setStep2Errors] = useState({})
  const [step3Data, setStep3Data] = useState({})
  const [step3Errors, setStep3Errors] = useState({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeTermsError, setAgreeTermsError] = useState("")

  const handleFormComplete = async (data) => {
    console.log("Form submitted:", data)
    setFormData(data)
    setFormSubmitted(true)
    // In a real app, you would send the data to an API here
  }

  if (formSubmitted) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8">
        <PageHeader title="Form Submitted" subtitle="Thank you for your submission" />

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Submission Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <FormValidationMessage
              message="Your application has been submitted successfully!"
              type="success"
              className="mb-6"
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Submitted Information:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto">{JSON.stringify(formData, null, 2)}</pre>

              <Button
                onClick={() => {
                  setFormSubmitted(false)
                  setFormData({})
                  setStep1Data({})
                  setStep1Errors({})
                  setStep2Data({})
                  setStep2Errors({})
                  setStep3Data({})
                  setStep3Errors({})
                  setAgreeTerms(false)
                  setAgreeTermsError("")
                }}
                className="bg-cedo-blue hover:bg-cedo-blue/90"
              >
                Start New Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = [
    {
      title: "Personal Information",
      content: ({ formData, onNext }) => {
        const [stepData, setStepData] = useState({
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
          email: formData.email || "",
          phone: formData.phone || "",
          birthDate: formData.birthDate || "",
        })

        const [errors, setErrors] = useState({})

        const handleChange = (field) => (value) => {
          setStepData((prev) => ({ ...prev, [field]: value }))
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

        const validateStep = () => {
          const newErrors = {}

          if (!stepData.firstName) newErrors.firstName = "First name is required"
          if (!stepData.lastName) newErrors.lastName = "Last name is required"
          if (!stepData.email) {
            newErrors.email = "Email is required"
          } else if (!/\S+@\S+\.\S+/.test(stepData.email)) {
            newErrors.email = "Email is invalid"
          }

          return newErrors
        }

        const handleSubmit = (e) => {
          e.preventDefault()

          // Validate form
          const newErrors = validateStep()
          setErrors(newErrors)

          // If no errors, go to next step
          if (Object.keys(newErrors).length === 0) {
            onNext(stepData)
          }
        }

        return (
          <ResponsiveForm id="step-0-form" onSubmit={handleSubmit}>
            <FormSection description="Please provide your personal details">
              <FormGrid cols={{ default: 1, sm: 2 }}>
                <FormGridItem>
                  <InputField
                    label="First Name"
                    id="firstName"
                    name="firstName"
                    value={stepData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Last Name"
                    id="lastName"
                    name="lastName"
                    value={stepData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
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
                    value={stepData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Phone"
                    id="phone"
                    name="phone"
                    value={stepData.phone}
                    onChange={handleInputChange}
                  />
                </FormGridItem>
              </FormGrid>

              <DatePickerField
                label="Date of Birth"
                id="birthDate"
                name="birthDate"
                value={stepData.birthDate}
                onChange={handleChange("birthDate")}
              />
            </FormSection>
          </ResponsiveForm>
        )
      },
    },
    {
      title: "Address",
      content: ({ formData, onNext }) => {
        const [stepData, setStepData] = useState({
          address: formData.address || "",
          city: formData.city || "",
          state: formData.state || "",
          zipCode: formData.zipCode || "",
          country: formData.country || "us",
        })

        const [errors, setErrors] = useState({})

        const handleChange = (field) => (value) => {
          setStepData((prev) => ({ ...prev, [field]: value }))
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

        const validateStep = () => {
          const newErrors = {}

          if (!stepData.address) newErrors.address = "Address is required"
          if (!stepData.city) newErrors.city = "City is required"
          if (!stepData.zipCode) newErrors.zipCode = "Zip code is required"

          return newErrors
        }

        const handleSubmit = (e) => {
          e.preventDefault()

          // Validate form
          const newErrors = validateStep()
          setErrors(newErrors)

          // If no errors, go to next step
          if (Object.keys(newErrors).length === 0) {
            onNext(stepData)
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

        return (
          <ResponsiveForm id="step-1-form" onSubmit={handleSubmit}>
            <FormSection description="Please provide your address information">
              <InputField
                label="Street Address"
                id="address"
                name="address"
                value={stepData.address}
                onChange={handleInputChange}
                error={errors.address}
                required
              />

              <FormGrid cols={{ default: 1, sm: 2, md: 3 }}>
                <FormGridItem>
                  <InputField
                    label="City"
                    id="city"
                    name="city"
                    value={stepData.city}
                    onChange={handleInputChange}
                    error={errors.city}
                    required
                  />
                </FormGridItem>
                <FormGridItem>
                  <SelectField
                    label="State"
                    id="state"
                    name="state"
                    value={stepData.state}
                    onChange={handleChange("state")}
                    options={stateOptions}
                    placeholder="Select state"
                  />
                </FormGridItem>
                <FormGridItem>
                  <InputField
                    label="Zip Code"
                    id="zipCode"
                    name="zipCode"
                    value={stepData.zipCode}
                    onChange={handleInputChange}
                    error={errors.zipCode}
                    required
                  />
                </FormGridItem>
              </FormGrid>

              <SelectField
                label="Country"
                id="country"
                name="country"
                value={stepData.country}
                onChange={handleChange("country")}
                options={countryOptions}
              />
            </FormSection>
          </ResponsiveForm>
        )
      },
    },
    {
      title: "Employment",
      content: ({ formData, onNext }) => {
        const [stepData, setStepData] = useState({
          jobTitle: formData.jobTitle || "",
          department: formData.department || "",
          startDate: formData.startDate || "",
          employmentType: formData.employmentType || "full-time",
          bio: formData.bio || "",
        })

        const [errors, setErrors] = useState({})

        const handleChange = (field) => (value) => {
          setStepData((prev) => ({ ...prev, [field]: value }))
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

        const validateStep = () => {
          const newErrors = {}

          if (!stepData.jobTitle) newErrors.jobTitle = "Job title is required"
          if (!stepData.department) newErrors.department = "Department is required"

          return newErrors
        }

        const handleSubmit = (e) => {
          e.preventDefault()

          // Validate form
          const newErrors = validateStep()
          setErrors(newErrors)

          // If no errors, go to next step
          if (Object.keys(newErrors).length === 0) {
            onNext(stepData)
          }
        }

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
          <ResponsiveForm id="step-2-form" onSubmit={handleSubmit}>
            <FormSection description="Please provide your employment details">
              <FormGrid cols={{ default: 1, sm: 2 }}>
                <FormGridItem>
                  <InputField
                    label="Job Title"
                    id="jobTitle"
                    name="jobTitle"
                    value={stepData.jobTitle}
                    onChange={handleInputChange}
                    error={errors.jobTitle}
                    required
                  />
                </FormGridItem>
                <FormGridItem>
                  <SelectField
                    label="Department"
                    id="department"
                    name="department"
                    value={stepData.department}
                    onChange={handleChange("department")}
                    options={departmentOptions}
                    placeholder="Select department"
                    error={errors.department}
                    required
                  />
                </FormGridItem>
              </FormGrid>

              <DatePickerField
                label="Start Date"
                id="startDate"
                name="startDate"
                value={stepData.startDate}
                onChange={handleChange("startDate")}
              />

              <RadioField
                label="Employment Type"
                name="employmentType"
                value={stepData.employmentType}
                onChange={handleChange("employmentType")}
                options={employmentTypeOptions}
                orientation="horizontal"
              />

              <TextareaField
                label="Professional Bio"
                id="bio"
                name="bio"
                value={stepData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about your professional background"
              />
            </FormSection>
          </ResponsiveForm>
        )
      },
    },
    {
      title: "Review & Submit",
      content: ({ formData, onNext, isSubmitting }) => {
        const handleSubmit = (e) => {
          e.preventDefault()

          if (!agreeTerms) {
            setAgreeTermsError("You must agree to the terms and conditions")
            return
          }

          onNext({ agreeTerms })
        }

        return (
          <ResponsiveForm id="step-3-form" onSubmit={handleSubmit}>
            <FormSection title="Review Your Information" description="Please review your information before submitting">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p>
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{formData.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p>{formData.birthDate ? new Date(formData.birthDate).toLocaleDateString() : "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Address</h3>
                  <p>{formData.address}</p>
                  <p>
                    {formData.city}, {formData.state} {formData.zipCode}
                  </p>
                  <p>{formData.country === "us" ? "United States" : formData.country}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Employment</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                      <p>{formData.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Department</p>
                      <p>{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p>{formData.startDate ? new Date(formData.startDate).toLocaleDateString() : "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                      <p>
                        {formData.employmentType === "full-time"
                          ? "Full-time"
                          : formData.employmentType === "part-time"
                            ? "Part-time"
                            : formData.employmentType === "contract"
                              ? "Contract"
                              : "Intern"}
                      </p>
                    </div>
                  </div>

                  {formData.bio && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Professional Bio</p>
                      <p className="text-sm">{formData.bio}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <CheckboxField
                    label="I confirm that all the information provided is accurate and complete"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={agreeTerms}
                    onChange={(checked) => {
                      setAgreeTerms(checked)
                      if (checked) setAgreeTermsError("")
                    }}
                    error={agreeTermsError}
                  />
                </div>
              </div>
            </FormSection>
          </ResponsiveForm>
        )
      },
    },
  ]

  return (
    <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8">
      <PageHeader title="Multi-Step Form Example" subtitle="A responsive multi-step form with validation" />

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Employee Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <FormWizard steps={steps} onComplete={handleFormComplete} />
        </CardContent>
      </Card>
    </div>
  )
}
