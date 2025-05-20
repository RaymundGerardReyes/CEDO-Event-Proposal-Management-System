"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, ChevronRight } from "lucide-react"

export function MultiStepForm({ steps, onComplete, className, initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData }
    setFormData(updatedData)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    } else {
      setIsSubmitting(true)
      try {
        await onComplete(updatedData)
      } catch (error) {
        console.error("Form submission error:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className={cn("space-y-8", className)}>
      <div className="hidden sm:block">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, index) => (
              <li key={step.name} className={cn(index !== steps.length - 1 ? "pr-8 sm:pr-20" : "", "relative")}>
                {index < currentStep ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-cedo-blue" />
                    </div>
                    <button
                      type="button"
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cedo-blue hover:bg-cedo-blue/90"
                      onClick={() => setCurrentStep(index)}
                    >
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                      <span className="sr-only">{step.name}</span>
                    </button>
                  </>
                ) : index === currentStep ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-cedo-blue bg-white"
                      aria-current="step"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-cedo-blue" aria-hidden="true" />
                      <span className="sr-only">{step.name}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{step.name}</span>
                    </div>
                  </>
                )}
                <div
                  className={cn(
                    "mt-2 hidden sm:block text-sm font-medium",
                    index === currentStep ? "text-cedo-blue" : "text-gray-500",
                  )}
                >
                  {step.name}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Mobile step indicator */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </p>
        <h3 className="text-lg font-medium text-cedo-blue">{steps[currentStep].name}</h3>
      </div>

      <div className="mt-8">
        <CurrentStepComponent formData={formData} onSubmit={handleNext} isLastStep={currentStep === steps.length - 1} />
      </div>

      <div className="flex justify-between pt-5 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
          Back
        </Button>
        <Button
          type="submit"
          form={`step-${currentStep}-form`}
          disabled={isSubmitting}
          className="bg-cedo-blue hover:bg-cedo-blue/90"
        >
          {currentStep === steps.length - 1 ? (
            isSubmitting ? (
              "Submitting..."
            ) : (
              "Complete"
            )
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
