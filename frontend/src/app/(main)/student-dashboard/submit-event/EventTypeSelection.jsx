"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { School, Users } from "lucide-react"
import { useState } from "react"

export const EventTypeSelection = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState(null)

  const handleSelect = (type) => {
    setSelectedType(type)
  }

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType)
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
            className={`cursor-pointer transition-all ${
              selectedType === "school"
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "hover:border-gray-300 hover:shadow-sm"
            }`}
            onClick={() => handleSelect("school")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <School className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">School-Based Event</h3>
              <p className="text-sm text-gray-500 mt-2">
                Events organized within the school or primarily for school community
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "community"
                ? "border-green-500 bg-green-50 shadow-md"
                : "hover:border-gray-300 hover:shadow-sm"
            }`}
            onClick={() => handleSelect("community")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Community-Based Event</h3>
              <p className="text-sm text-gray-500 mt-2">
                Events organized for or with the broader community outside the school
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          className={`${!selectedType ? "opacity-50 cursor-not-allowed" : ""} bg-blue-600 hover:bg-blue-700 text-white`}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}

export default EventTypeSelection
