// frontend/src/app/(main)/admin-dashboard/proposals/new/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Import Suspense if it's not already imported at the top level
import { FileUploader } from "@/components/file-uploader";
import { PageHeader } from "@/components/page-header"; // Assuming this is the correct path for admin
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

// Custom form validation function
const validateForm = (values) => {
  const errors = {};

  if (!values.title) {
    errors.title = "Title is required";
  } else if (values.title.length < 5) {
    errors.title = "Title must be at least 5 characters";
  }

  if (!values.category) {
    errors.category = "Please select a category";
  }

  if (!values.description) {
    errors.description = "Description is required";
  } else if (values.description.length < 20) {
    errors.description = "Description must be at least 20 characters";
  }

  if (!values.startDate) {
    errors.startDate = "Start date is required";
  }
  if (!values.endDate) {
    errors.endDate = "End date is required";
  }
  if (!values.location) {
    errors.location = "Location is required";
  } else if (values.location.length < 3) {
    errors.location = "Location must be at least 3 characters";
  }
  if (!values.budget) {
    errors.budget = "Budget is required";
  }
  // Ensure budget is a number or can be converted to one if you perform numerical checks
  // else if (isNaN(parseFloat(values.budget))) {
  //   errors.budget = "Budget must be a valid number";
  // }

  if (!values.objectives) {
    errors.objectives = "Objectives are required";
  } else if (values.objectives.length < 20) {
    errors.objectives = "Objectives must be at least 20 characters";
  }

  return errors;
};

// Define a fallback component for the main form content
const NewProposalFormFallback = () => (
  <div className="flex justify-center items-center h-64">
    <p className="text-gray-500">Loading proposal form...</p>
    {/* You can add a spinner or more elaborate skeleton here */}
  </div>
);

// Define a fallback for PageHeader if it's complex or might take time
const PageHeaderFallback = () => (
  <div className="mb-6">
    <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
);


// Extracted form content into its own component
const ProposalFormContent = () => {
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState([]);
  const { toast } = useToast();

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
    },
  });

  function onSubmit(data) {
    const errors = validateForm(data);
    form.clearErrors(); // Clear previous manual errors

    if (Object.keys(errors).length === 0) {
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been submitted successfully.",
        variant: "success", // Optional: if you have variants
      });
      console.log("Form Data:", data);
      console.log("Uploaded Files:", files);
      // Here you would typically send the data and files to your backend
      // form.reset(); // Optionally reset the form
      // setFiles([]); // Optionally clear files
    } else {
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field, { type: "manual", message });
      });
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
    }
  }

  function saveDraft() {
    // Implement actual draft saving logic here
    const currentValues = form.getValues();
    console.log("Saving draft:", currentValues, files);
    toast({
      title: "Draft Saved",
      description: "Your proposal draft has been saved.",
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Proposal Information</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            Provide detailed information about your proposed event or project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
              <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-sm">Basic Details</TabsTrigger>
              <TabsTrigger value="planning" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-sm">Planning & Budget</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm rounded-sm">Supporting Docs</TabsTrigger>
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
                        <FormDescription>A clear, concise title for your event or project.</FormDescription>
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
                        <FormDescription>Select the category that best fits your proposal.</FormDescription>
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
                        <FormDescription>Explain what your event or project is about.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-2">
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
                        <FormLabel>Estimated Budget (PHP)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || '')} // Ensure it's a number
                          />
                        </FormControl>
                        <FormDescription>Enter the total estimated budget.</FormDescription>
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
                        <FormDescription>Clearly state what you aim to achieve with this proposal.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-2">
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
                        Upload any relevant documents (e.g., budget breakdown, event schedule, permits). Max 5 files, 5MB each.
                      </p>
                    </div>

                    <FileUploader
                      files={files}
                      setFiles={setFiles}
                      maxFiles={5}
                      maxSize={5 * 1024 * 1024} // 5MB
                    />

                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        By submitting this proposal, you confirm that all information is accurate and you agree to the terms and conditions of the Event Proposal Management System.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("planning")}>
                      Back: Planning & Budget
                    </Button>
                    <div className="space-x-2">
                      <Button type="button" variant="outline" onClick={saveDraft}>
                        Save Draft
                      </Button>
                      <Button type="submit" className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90 text-white">
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
  );
};


export default function NewProposalPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      {/* Wrap PageHeader in Suspense if it uses useSearchParams and is a Client Component */}
      {/* This assumes PageHeader itself is marked 'use client' if it uses client hooks. */}
      <Suspense fallback={<PageHeaderFallback />}>
        <PageHeader
          title="Submit New Proposal"
          subtitle="Fill out the form to submit your event or project proposal"
        // breadcrumbs={[{ name: "Admin Dashboard", href: "/admin-dashboard" }, { name: "Proposals", href: "/admin-dashboard/proposals" }, {name: "New"}]}
        />
      </Suspense>

      <Suspense fallback={<NewProposalFormFallback />}>
        <ProposalFormContent />
      </Suspense>
    </div>
  );
}
