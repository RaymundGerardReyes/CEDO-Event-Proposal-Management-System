"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/page-header"

export default function NewProposalPage() {
  const [activeTab, setActiveTab] = useState("details")
  const [files, setFiles] = useState([])
  const { toast } = useToast()

  const form = useForm({
    defaultValues: {
      title: "",
      category: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      budget: "",
      objectives: "",
      volunteersNeeded: "",
      organizationType: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      termsAgreed: false,
    },
  })

  function onSubmit(data) {
    // Validate form data
    if (!data.title || data.title.length < 5) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 5 characters",
        variant: "destructive",
      })
      return
    }

    if (!data.description || data.description.length < 20) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 20 characters",
        variant: "destructive",
      })
      return
    }

    if (!data.termsAgreed) {
      toast({
        title: "Validation Error",
        description: "You must agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    // Submit the form data to the API
    fetch("/api/proposals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        files: files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data) => {
        toast({
          title: "Partnership Proposal Submitted",
          description: "Your proposal has been submitted successfully and is pending review.",
        })
        console.log(data)
      })
      .catch((error) => {
        console.error("Error:", error)
        toast({
          title: "Submission Error",
          description: "There was a problem submitting your proposal. Please try again.",
          variant: "destructive",
        })
      })
  }

  function saveDraft() {
    const formData = form.getValues()

    // Save draft to local storage
    localStorage.setItem(
      "proposalDraft",
      JSON.stringify({
        formData,
        files: files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      }),
    )

    toast({
      title: "Draft Saved",
      description: "Your proposal draft has been saved.",
    })
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader
        title="Submit New Partnership Proposal"
        subtitle="Fill out the form to submit your partnership proposal"
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        <Card className="border border-[#f0f0f0] shadow-sm">
          <CardHeader>
            <CardTitle>Partnership Proposal Information</CardTitle>
            <CardDescription>Provide detailed information about your proposed partnership</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Basic Details</TabsTrigger>
                <TabsTrigger value="planning">Planning & Budget</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
                <TabsTrigger value="documents">Supporting Documents</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="details" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposal Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the title of your proposal" {...field} />
                          </FormControl>
                          <FormDescription>A clear, concise title for your partnership proposal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select organization type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="internal">Internal (City Hall Department)</SelectItem>
                              <SelectItem value="external">External (Institution/Company)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select whether you're an internal or external organization</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="health">Health</SelectItem>
                              <SelectItem value="environment">Environment</SelectItem>
                              <SelectItem value="community">Community Development</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the category that best fits your proposal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a detailed description of your proposal"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Explain what your partnership proposal is about</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={saveDraft}>
                        Save Draft
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("planning")}>
                        Next: Planning & Budget
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Rest of the form tabs and content */}
                  {/* Planning & Budget tab */}
                  {/* Contact Info tab */}
                  {/* Supporting Documents tab */}
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
