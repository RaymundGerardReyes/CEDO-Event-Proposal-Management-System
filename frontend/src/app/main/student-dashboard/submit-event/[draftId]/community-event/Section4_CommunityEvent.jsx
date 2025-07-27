"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useDraft } from '@/hooks/useDraft'
import { cn } from "@/lib/utils"
import { InfoIcon, LockIcon, Paperclip, UploadCloud, X } from "lucide-react"
import { useEffect, useRef } from "react"
import DatePickerComponent from "../../components/DatePickerComponent"
import { getFieldClasses, hasFieldError } from "../../validation"
// Modularized logic
import { useCommunityEventForm } from "./useCommunityEventForm"
import { getInitialFormState } from "./utils"

export const Section4_CommunityEvent = ({
  formData = {},
  handleInputChange,
  handleFileChange,
  onNext,
  onPrevious,
  onWithdraw,
  disabled = false,
  validationErrors = {},
  draftId,
}) => {
  const { toast } = useToast();
  const { draft, patch } = useDraft(draftId);

  // Use modularized form logic
  const {
    formState,
    setFormState,
    localValidationErrors,
    setLocalValidationErrors,
    filePreviews,
    setFilePreviews,
    lastSavedRef,
    handleLocalInputChange,
    handleDateChange,
    handleRadioChange,
    handleTargetAudienceChange,
    handleFileUpload,
    removeFile,
    validate,
  } = useCommunityEventForm({
    initialDraftData: draft?.payload?.communityEvent,
    handleInputChange,
    handleFileChange,
    disabled,
  });

  const fileInputRefs = useRef({});

  // Autofill handler for debugging
  const handleAutoFill = () => {
    const mockFile = new File(["dummy content"], "MockFile.pdf", { type: "application/pdf" });
    setFormState({
      communityEventName: "Mock Community Event",
      communityVenue: "Mock Venue",
      communityStartDate: new Date(),
      communityEndDate: new Date(Date.now() + 86400000),
      communityTimeStart: "09:00",
      communityTimeEnd: "17:00",
      communityEventType: "seminar-webinar",
      communityTargetAudience: ["1st Year", "2nd Year", "Leaders"],
      communityEventMode: "online",
      communitySDPCredits: "2",
      communityGPOAFile: mockFile,
      communityProposalFile: mockFile,
    });
    setFilePreviews({
      communityGPOAFile: "MockFile.pdf",
      communityProposalFile: "MockFile.pdf",
    });
    // Simulate file input for file upload fields
    Object.keys(fileInputRefs.current).forEach((field) => {
      if (fileInputRefs.current[field]) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(mockFile);
        fileInputRefs.current[field].files = dataTransfer.files;
      }
    });
  };

  // Effects for draft loading and file previews
  useEffect(() => {
    if (draft?.payload?.communityEvent && Object.keys(draft.payload.communityEvent).length > 0) {
      setFormState(getInitialFormState(draft.payload.communityEvent));
      setFilePreviews({
        communityGPOAFile: draft.payload.communityEvent.communityGPOAFile?.name || "",
        communityProposalFile: draft.payload.communityEvent.communityProposalFile?.name || "",
      });
    }
  }, [draft, setFormState, setFilePreviews]);

  // Render
  if (!draft) return <Skeleton className="w-full h-96" />;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
              Section 4 of 5: Community-Based Event Details
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
              Provide comprehensive details about your proposed community-based event.
            </CardDescription>
          </div>
          {disabled && (
            <div className="flex items-center text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 rounded-md font-medium self-start sm:self-center">
              <LockIcon className="h-4 w-4 mr-2" />
              <span>Read-only Mode</span>
            </div>
          )}
          {/* Debug autofill button */}
          {!disabled && process.env.NODE_ENV === "development" && (
            <Button type="button" variant="outline" onClick={handleAutoFill} className="ml-2">
              Auto Fill (Debug)
            </Button>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
            <div>Draft ID: {draft?.draftId || 'Not loaded'}</div>
            <div>Draft Ready: {draft?.draftId ? '✅' : '❌'}</div>
            <div>Draft Status: {draft?.status || 'Unknown'}</div>
            <div>Last Updated: {draft?.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'Never'}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Basic Information */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Basic Information</legend>
          <div className="space-y-2">
            <Label htmlFor="communityEventName" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              Event/Activity Name <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="communityEventName"
              name="communityEventName"
              value={formState.communityEventName}
              onChange={handleLocalInputChange}
              placeholder="e.g., Community Skills Workshop"
              className={getFieldClasses("communityEventName", localValidationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
              disabled={disabled}
              required
            />
            {localValidationErrors["communityEventName"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityEventName"]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityVenue" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              Venue (Platform or Address) <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="communityVenue"
              name="communityVenue"
              value={formState.communityVenue}
              onChange={handleLocalInputChange}
              placeholder="e.g., Community Center or Zoom Meeting ID"
              className={getFieldClasses("communityVenue", localValidationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
              disabled={disabled}
              required
            />
            {localValidationErrors["communityVenue"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityVenue"]}</p>
            )}
          </div>
        </fieldset>
        {/* Date & Time */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Date & Time</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <DatePickerComponent
              label="Start Date"
              fieldName="communityStartDate"
              value={formState.communityStartDate}
              onChange={handleDateChange}
              disabled={disabled}
              required={true}
              error={localValidationErrors.communityStartDate}
            />
            <DatePickerComponent
              label="End Date"
              fieldName="communityEndDate"
              value={formState.communityEndDate}
              onChange={handleDateChange}
              disabled={disabled}
              required={true}
              error={localValidationErrors.communityEndDate}
            />
            <div className="space-y-2">
              <Label htmlFor="communityTimeStart" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Start Time <span className="text-red-500 ml-0.5">*</span></Label>
              <Input
                id="communityTimeStart"
                name="communityTimeStart"
                type="time"
                value={formState.communityTimeStart}
                onChange={handleLocalInputChange}
                className={getFieldClasses("communityTimeStart", localValidationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                disabled={disabled}
                required
              />
              {localValidationErrors["communityTimeStart"] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityTimeStart"]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="communityTimeEnd" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">End Time <span className="text-red-500 ml-0.5">*</span></Label>
              <Input
                id="communityTimeEnd"
                name="communityTimeEnd"
                type="time"
                value={formState.communityTimeEnd}
                onChange={handleLocalInputChange}
                className={getFieldClasses("communityTimeEnd", localValidationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                disabled={disabled}
                required
              />
              {localValidationErrors["communityTimeEnd"] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityTimeEnd"]}</p>
              )}
            </div>
          </div>
        </fieldset>
        {/* Event Specifics */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Event Specifics</legend>
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Type of Event <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={formState.communityEventType}
              onValueChange={(value) => handleRadioChange("communityEventType", value)}
              className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityEventType", localValidationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["Academic Enhancement", "Seminar/Webinar", "General Assembly", "Leadership Training", "Others"].map(type => (
                <div className="flex items-center space-x-2" key={type}>
                  <RadioGroupItem value={type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')} id={`community-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{type}</Label>
                </div>
              ))}
            </RadioGroup>
            {localValidationErrors["communityEventType"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityEventType"]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Target Audience <span className="text-red-500 ml-0.5">*</span></Label>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityTargetAudience", localValidationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}>
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Leaders", "Alumni"].map((audience) => (
                <div className="flex items-center space-x-2" key={audience}>
                  <Checkbox
                    id={`community-audience-${audience}`}
                    checked={formState.communityTargetAudience?.includes(audience) || false}
                    onCheckedChange={(checked) => handleTargetAudienceChange(audience, Boolean(checked))}
                    disabled={disabled}
                    className="data-[state=checked]:bg-cedo-blue dark:data-[state=checked]:bg-cedo-gold data-[state=checked]:border-transparent dark:border-gray-500"
                  />
                  <Label htmlFor={`community-audience-${audience}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{audience}</Label>
                </div>
              ))}
            </div>
            {localValidationErrors["communityTargetAudience"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityTargetAudience"]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Mode of Event <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={formState.communityEventMode}
              onValueChange={(value) => handleRadioChange("communityEventMode", value)}
              className={`grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityEventMode", localValidationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["Online", "Offline", "Hybrid"].map(mode => (
                <div className="flex items-center space-x-2" key={mode}>
                  <RadioGroupItem value={mode.toLowerCase()} id={`community-mode-${mode.toLowerCase()}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-mode-${mode.toLowerCase()}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{mode}</Label>
                </div>
              ))}
            </RadioGroup>
            {localValidationErrors["communityEventMode"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communityEventMode"]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Number of SDP Credits <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={String(formState.communitySDPCredits)}
              onValueChange={(value) => handleRadioChange("communitySDPCredits", value)}
              className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communitySDPCredits", localValidationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["1", "2"].map(credit => (
                <div className="flex items-center space-x-2" key={credit}>
                  <RadioGroupItem value={credit} id={`community-credit-${credit}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-credit-${credit}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{credit}</Label>
                </div>
              ))}
            </RadioGroup>
            {localValidationErrors["communitySDPCredits"] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors["communitySDPCredits"]}</p>
            )}
          </div>
        </fieldset>
        {/* Attachments */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Attachments</legend>
          {[
            { label: "General Plan of Action (GPOA)", name: "communityGPOAFile", hint: "Filename: OrganizationName_GPOA.pdf/docx/xlsx" },
            { label: "Project Proposal Document", name: "communityProposalFile", hint: "Filename: OrganizationName_PP.pdf/docx/xlsx. Must include summary, objectives, timeline, budget." }
          ].map(fileField => (
            <div key={fileField.name} className="space-y-2">
              <Label htmlFor={fileField.name} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                {fileField.label} <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <div className={cn("mt-1 group relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ease-in-out hover:border-cedo-blue dark:border-gray-600 dark:hover:border-cedo-gold",
                disabled && "opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50",
                hasFieldError(fileField.name, localValidationErrors) && "border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-600 bg-red-50 dark:bg-red-900/30",
                filePreviews[fileField.name] && !hasFieldError(fileField.name, localValidationErrors) && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 hover:border-green-600 dark:hover:border-green-600"
              )}>
                <Label htmlFor={fileField.name} className={cn("cursor-pointer w-full flex flex-col items-center justify-center", disabled && "cursor-not-allowed")}>
                  <UploadCloud className={cn("h-10 w-10 mb-2 text-gray-400 dark:text-gray-500 group-hover:text-cedo-blue dark:group-hover:text-cedo-gold transition-colors", filePreviews[fileField.name] && !hasFieldError(fileField.name, localValidationErrors) && "text-green-600 dark:text-green-500")} />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filePreviews[fileField.name] ? (
                      <span className="flex items-center gap-2 text-cedo-blue dark:text-cedo-gold">
                        <Paperclip className="h-4 w-4 flex-shrink-0" /> {filePreviews[fileField.name]}
                      </span>
                    ) : (
                      <>Drag & drop or <span className="font-semibold text-cedo-blue dark:text-cedo-gold">click to browse</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{fileField.hint}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Max 5MB. Allowed: PDF, Word, Excel.</p>
                </Label>
                <Input
                  id={fileField.name}
                  name={fileField.name}
                  type="file"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, fileField.name)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                  ref={el => fileInputRefs.current[fileField.name] = el}
                />
                {filePreviews[fileField.name] && !disabled && (
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={() => removeFile(fileField.name)}
                    aria-label={`Remove ${fileField.label}`}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {localValidationErrors[fileField.name] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{localValidationErrors[fileField.name]}</p>
              )}
            </div>
          ))}
        </fieldset>
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200 rounded-lg">
          <InfoIcon className="h-5 w-5" />
          <AlertTitle className="font-semibold">Important Reminders</AlertTitle>
          <AlertDescription className="text-sm">
            All fields marked with <span className="text-red-500 font-semibold">*</span> are mandatory.
            Ensure all documents are correctly named and in the specified formats before submission.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onPrevious} disabled={disabled} className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-cedo-blue dark:focus:ring-cedo-gold">
            Back to Section 2
          </Button>
          {!disabled && (
            <Button variant="destructive" onClick={onWithdraw} className="w-full sm:w-auto">
              Withdraw Proposal
            </Button>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {!disabled && (
            <Button
              variant="outline"
              onClick={validate}
              className="w-full sm:w-auto border-cedo-blue text-cedo-blue hover:bg-cedo-blue hover:text-white dark:border-cedo-gold dark:text-cedo-gold dark:hover:bg-cedo-gold dark:hover:text-cedo-blue"
            >
              Save Progress
            </Button>
          )}
          <Button
            onClick={onNext}
            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white w-full sm:w-auto dark:bg-cedo-gold dark:text-cedo-blue dark:hover:bg-cedo-gold/90 focus:ring-offset-2 focus:ring-2 focus:ring-cedo-blue dark:focus:ring-cedo-gold"
          >
            Save & Continue to Section 5
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};