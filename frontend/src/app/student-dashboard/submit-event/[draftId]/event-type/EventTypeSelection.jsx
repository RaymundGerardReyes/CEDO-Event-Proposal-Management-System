"use client"

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { Loader2, School, Users } from "lucide-react"
import { useState } from "react"

export const EventTypeSelection = ({ onSelect, onPrevious, isSaving = false }) => {
  const [selectedType, setSelectedType] = useState(null)

  const handleSelect = (type) => {
    if (isSaving) return; // Prevent selection while saving
    setSelectedType(type)
  }

  const handleContinue = () => {
    if (selectedType && !isSaving) {
      // 🔧 ENHANCED: Clear mapping for routing to specific event sections
      const mappedType = selectedType === "school" ? "school-based" :
        selectedType === "community" ? "community-based" : selectedType

      console.log('🚀 EventTypeSelection: Selected type:', selectedType, 'Mapped to:', mappedType)
      console.log('🎯 Routing will be:')
      console.log('  - school-based → SchoolEvent section')
      console.log('  - community-based → CommunityEvent section')

      onSelect(mappedType)
    }
  }

  const handlePrevious = () => {
    if (onPrevious && !isSaving) {
      onPrevious()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Select Event Type</CardTitle>
        <CardDescription>Choose the type of event you want to submit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all ${selectedType === "school"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "hover:border-gray-300 hover:shadow-sm"
              } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleSelect("school")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <School className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">School-Based Event</h3>
              <p className="text-sm text-gray-500 mt-2">
                Events organized within the school or primarily for school community
              </p>
              <div className="mt-2 text-xs text-blue-600 font-medium">
                → Routes to School Event Section
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${selectedType === "community"
              ? "border-green-500 bg-green-50 shadow-md"
              : "hover:border-gray-300 hover:shadow-sm"
              } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleSelect("community")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Community-Based Event</h3>
              <p className="text-sm text-gray-500 mt-2">
                Events organized for or with the broader community outside the school
              </p>
              <div className="mt-2 text-xs text-green-600 font-medium">
                → Routes to Community Event Section
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ ENHANCED: Loading indicator */}
        {isSaving && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600 font-medium">Saving your selection...</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={!onPrevious || isSaving}
        >
          Previous
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedType || isSaving}
          className={`${!selectedType || isSaving ? "opacity-50 cursor-not-allowed" : ""} bg-blue-600 hover:bg-blue-700 text-white`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default EventTypeSelection
