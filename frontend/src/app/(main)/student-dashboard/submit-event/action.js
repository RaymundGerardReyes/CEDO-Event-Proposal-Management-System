"use server"

import { revalidatePath } from "next/cache"

/**
 * Submit an event proposal to the server
 * @param {Object} formData - The form data for the event proposal
 * @returns {Promise<Object>} - The result of the submission
 */
export async function submitEventProposal(formData) {
  try {
    // In a real application, this would connect to a database
    // For now, we'll simulate a successful submission

    // Validate the form data based on organization type
    if (!formData.organizationName) {
      throw new Error("Missing required fields: Organization Name")
    }

    // Check if school-based event fields are required and present
    if (formData.organizationTypes?.includes("school-based")) {
      if (!formData.schoolEventName) {
        throw new Error("Missing required fields: School Event Name")
      }
    }

    // Check if community-based event fields are required and present
    if (formData.organizationTypes?.includes("community-based")) {
      if (!formData.communityEventName) {
        throw new Error("Missing required fields: Community Event Name")
      }
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a unique ID for the event
    const eventId = `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Log the submission (would be saved to database in production)
    console.log("Event proposal submitted:", {
      id: eventId,
      ...formData,
      submittedAt: new Date().toISOString(),
    })

    // Revalidate the events page to show the new event
    revalidatePath("/events")

    // Return success response
    return {
      success: true,
      id: eventId,
      message: "Event proposal submitted successfully",
    }
  } catch (error) {
    console.error("Error submitting event proposal:", error)
    throw new Error(error.message || "Failed to submit event proposal. Please try again.")
  }
}

/**
 * Get all event proposals
 * @returns {Promise<Array>} - Array of event proposals
 */
export async function getEventProposals() {
  try {
    // In a real application, this would fetch from a database
    // For now, we'll return mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Return mock data
    return [
      {
        id: "event-123",
        eventTitle: "Community Clean-up Day",
        eventType: "community",
        organizationName: "Green Earth Initiative",
        status: "approved",
        submittedAt: "2023-05-15T10:30:00Z",
      },
      {
        id: "event-456",
        eventTitle: "Science Fair Workshop",
        eventType: "school",
        organizationName: "Edison Elementary School",
        status: "pending",
        submittedAt: "2023-05-18T14:45:00Z",
      },
    ]
  } catch (error) {
    console.error("Error fetching event proposals:", error)
    throw new Error("Failed to fetch event proposals. Please try again.")
  }
}

/**
 * Get a single event proposal by ID
 * @param {string} id - The ID of the event proposal
 * @returns {Promise<Object>} - The event proposal
 */
export async function getEventProposal(id) {
  try {
    // In a real application, this would fetch from a database
    // For now, we'll return mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return mock data
    if (id === "event-123") {
      return {
        id: "event-123",
        eventTitle: "Community Clean-up Day",
        eventDescription: "A day dedicated to cleaning up our local parks and streets.",
        eventType: "community",
        organizationName: "Green Earth Initiative",
        organizationContact: "Jane Smith",
        organizationEmail: "jane@greenearthinitiative.org",
        organizationPhone: "555-123-4567",
        communityVenue: "Central Park",
        expectedAttendance: "50",
        targetAudience: "All community members",
        communityPartners: "Local businesses, City Parks Department",
        eventDate: "2023-06-15",
        eventTime: "9:00 AM",
        eventDuration: "4hours",
        isRecurring: false,
        reportingContact: "Jane Smith",
        reportingEmail: "jane@greenearthinitiative.org",
        evaluationMethod: "survey",
        successMetrics: "Amount of trash collected, number of participants",
        willProvidePhotos: true,
        willProvideFeedback: true,
        status: "approved",
        submittedAt: "2023-05-15T10:30:00Z",
      }
    }

    throw new Error("Event not found")
  } catch (error) {
    console.error("Error fetching event proposal:", error)
    throw new Error("Failed to fetch event proposal. Please try again.")
  }
}
