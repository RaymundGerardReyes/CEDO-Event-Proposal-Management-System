"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { FileUploader } from "@/components/file-uploader"; // Assuming this component is correctly defined
import { PageHeader } from "@/components/page-header"; // Assuming this component is correctly defined
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react"; // Import Suspense
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define schema using zod
const proposalSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  category: z.string({ required_error: "Please select a category" }).min(1, { message: "Please select a category" }), // Ensure not empty
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  startDate: z.string({ required_error: "Start date is required" }).min(1, { message: "Start date is required" }), // Ensure not empty
  endDate: z.string({ required_error: "End date is required" }).min(1, { message: "End date is required" }), // Ensure not empty
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  budget: z.string().min(1, { message: "Budget is required" }), // Or z.number().positive() if you parse it
  objectives: z.string().min(20, { message: "Objectives must be at least 20 characters" }),
});

// Loading component for the form
function NewProposalLoadingSkeleton() {
  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8 animate-pulse">
      <div className="h-8 w-1/3 bg-gray-300 rounded mb-2"></div> {/* PageHeader title */}
      <div className="h-4 w-1/2 bg-gray-300 rounded mb-6"></div> {/* PageHeader subtitle */}
      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        <Card className="border border-[#f0f0f0] shadow-sm">
          <CardHeader>
            <div className="h-6 w-1/2 bg-gray-300 rounded mb-1"></div> {/* CardTitle */}
            <div className="h-4 w-3/4 bg-gray-300 rounded"></div> {/* CardDescription */}
          </CardHeader>
          <CardContent>
            <div className="grid w-full grid-cols-3 gap-1 mb-4">
              <div className="h-10 bg-gray-300 rounded"></div> {/* Tab */}
              <div className="h-10 bg-gray-200 rounded"></div> {/* Tab */}
              <div className="h-10 bg-gray-200 rounded"></div> {/* Tab */}
            </div>
            {/* Form field placeholders */}
            <div className="space-y-4 pt-4">
              <div className="h-16 w-full bg-gray-200 rounded"></div>
              <div className="h-16 w-full bg-gray-200 rounded"></div>
              <div className="h-24 w-full bg-gray-200 rounded"></div>
              <div className="flex justify-between">
                <div className="h-10 w-24 bg-gray-300 rounded"></div>
                <div className="h-10 w-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// This component now contains the main form logic and UI
function NewProposalFormContent() {
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState([]);
  const { toast } = useToast();

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
  });

  function onSubmit(data) {
    toast({
      title: "Proposal Submitted",
      description: "Your proposal has been submitted successfully.",
    });
    console.log("Form Data:", data);
    console.log("Uploaded Files:", files);
    // Here you would typically send 'data' and 'files' to your backend API
    // form.reset(); // Optionally reset form after submission
    // setFiles([]); // Optionally clear files
  }

  function saveDraft() {
    const currentValues = form.getValues(); // Get current form values
    toast({
      title: "Draft Saved",
      description: "Your proposal draft has been saved.",
    });
    console.log("Draft Data:", currentValues);
    console.log("Draft Files:", files);
    // Implement your draft saving logic here
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
                            {/* Consider using type="text" and manage numeric conversion for better UX with currency */}
                            <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber || e.target.value)} />
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
                        setFiles={setFiles} // Make sure FileUploader calls setFiles with the new array of files
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
  );
}

// Default export for the page, wrapping the content with Suspense
export default function NewProposalPage() {
  return (
    <Suspense fallback={<NewProposalLoadingSkeleton />}>
      <NewProposalFormContent />
    </Suspense>
  );
}