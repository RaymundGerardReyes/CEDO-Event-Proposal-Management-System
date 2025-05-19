"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/page-header"

// Define schema using zod
const proposalSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  category: z.string({ required_error: "Please select a category" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  startDate: z.string({ required_error: "Start date is required" }),
  endDate: z.string({ required_error: "End date is required" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  budget: z.string().min(1, { message: "Budget is required" }),
  objectives: z.string().min(20, { message: "Objectives must be at least 20 characters" }),
})

export default function NewProposalPage() {
  const [activeTab, setActiveTab] = useState("details")
  const [files, setFiles] = useState([])
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      budget: "",
      objectives: "",
    },
  })

  function onSubmit(data) {
    toast({
      title: "Proposal Submitted",
      description: "Your proposal has been submitted successfully.",
    })
    console.log(data, files)
  }

  function saveDraft() {
    toast({
      title: "Draft Saved",
      description: "Your proposal draft has been saved.",
    })
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Submit New Proposal" subtitle="Fill out the form to submit your event or project proposal" />

      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        <Card className="border border-[#f0f0f0] shadow-sm">
          <CardHeader>
            <CardTitle>Proposal Information</CardTitle>
            <CardDescription>Provide detailed information about your proposed event or project</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Basic Details</TabsTrigger>
                <TabsTrigger value="planning">Planning & Budget</TabsTrigger>
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
                          <FormDescription>A clear, concise title for your event or project</FormDescription>
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
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="cultural">Cultural</SelectItem>
                              <SelectItem value="community">Community Service</SelectItem>
                              <SelectItem value="leadership">Leadership</SelectItem>
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
                          <FormDescription>Explain what your event or project is about</FormDescription>
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

                  <TabsContent value="planning" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Where will this event take place?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Budget</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormDescription>Enter the total estimated budget in dollars</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objectives & Outcomes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What are the main objectives and expected outcomes?"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Clearly state what you aim to achieve with this proposal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                        Back: Basic Details
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("documents")}>
                        Next: Supporting Documents
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Supporting Documents</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload any relevant documents to support your proposal (budget breakdown, schedule, etc.)
                        </p>
                      </div>

                      <FileUploader
                        files={files}
                        setFiles={setFiles}
                        maxFiles={5}
                        maxSize={5 * 1024 * 1024} // 5MB
                      />

                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground">
                          By submitting this proposal, you agree to the terms and conditions of the Event Proposal
                          Management System.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("planning")}>
                        Back: Planning & Budget
                      </Button>
                      <div className="space-x-2">
                        <Button type="button" variant="outline" onClick={saveDraft}>
                          Save Draft
                        </Button>
                        <Button type="submit" className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90">
                          Submit Proposal
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
