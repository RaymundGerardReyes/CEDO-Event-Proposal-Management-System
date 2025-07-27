"use client"

import { Alert, AlertDescription } from "@/components/dashboard/student/ui/alert"
import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { InfoIcon, LockIcon } from "lucide-react"
import React from "react"

// 🆕 Modular hooks - Fixed imports to use existing hooks
import {
  useSection3Debug,
  useSection3Files,
  useSection3Handlers,
  useSection3Navigation,
  useSection3Save,
  useSection3State
} from "./useSchoolEventForm"

// 🆕 Import missing components
import { DebugPanel } from "../../../debug/DebugPanel"
import { BasicInfoSection } from "../../components/shared/BasicInfoSection"
import { DateTimeSection } from "../../components/shared/DateTimeSection"

// 🆕 Modular components - Simplified to use inline components for now
// Note: These components can be extracted later if needed

// 🆕 Inline EventSpecificsSection component
const EventSpecificsSection = ({
  localFormData,
  handleRadioChange,
  handleTargetAudienceChange,
  validationErrors,
  disabled
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Event Specifics
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define the specific details and requirements for your school event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Type */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Event Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {['academic', 'cultural', 'sports', 'community-service', 'leadership', 'other'].map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="eventType"
                  value={type}
                  checked={localFormData.eventType === type}
                  onChange={(e) => handleRadioChange('eventType', e.target.value)}
                  disabled={disabled}
                  className="text-cedo-blue focus:ring-cedo-blue"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {type.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
          {validationErrors.eventType && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.eventType}</p>
          )}
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Audience <span className="text-red-500">*</span>
          </label>
          <select
            value={localFormData.targetAudience || ''}
            onChange={(e) => handleTargetAudienceChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cedo-blue focus:border-cedo-blue dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Select target audience</option>
            <option value="students">Students</option>
            <option value="faculty">Faculty</option>
            <option value="parents">Parents</option>
            <option value="community">Community</option>
            <option value="mixed">Mixed Audience</option>
          </select>
          {validationErrors.targetAudience && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.targetAudience}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// 🆕 Inline AttachmentsSection component
const AttachmentsSection = ({
  localFormData,
  filePreviews,
  existingFiles,
  loadingFiles,
  handleFileUpload,
  handleFileRemoval,
  handleFileDownload,
  validationErrors,
  disabled
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Attachments & Documents
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload supporting documents for your event proposal.
        </p>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Documents
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e, 'attachments')}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cedo-blue focus:border-cedo-blue dark:bg-gray-700 dark:text-gray-100"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
          </p>
        </div>

        {/* File Previews */}
        {filePreviews.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files:</h4>
            {filePreviews.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleFileRemoval(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Existing Files */}
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Previously Uploaded:</h4>
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleFileDownload(file)}
                  disabled={disabled || loadingFiles}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {loadingFiles ? 'Loading...' : 'Download'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Section3_SchoolEventComponent = ({
  formData,
  handleInputChange,
  handleFileChange,
  onNext,
  onPrevious,
  onWithdraw,
  disabled = false,
  validationErrors = {},
}) => {
  // 🆕 Use modular hooks
  const {
    localFormData,
    setLocalFormData,
    filePreviews,
    setFilePreviews,
    isSaving,
    setIsSaving,
    isInitialMount,
    localStorageFormData,
    recoveryAttempted,
    componentMountedRef,
    userInteractionRef,
    proposalIdForFiles,
    organizationDataForFiles,
    toast
  } = useSection3State(formData, disabled);

  const {
    handleLocalInputChange,
    handleDateChange,
    handleTargetAudienceChange,
    handleRadioChange,
    handleFileUpload,
    handleFileRemoval
  } = useSection3Handlers({
    disabled,
    localFormData,
    setLocalFormData,
    setFilePreviews,
    toast,
    userInteractionRef
  });

  const { handleSaveData } = useSection3Save({
    localFormData,
    formData,
    localStorageFormData,
    isInitialMount,
    isSaving,
    setIsSaving,
    handleInputChange,
    toast
  });

  const { handleNext } = useSection3Navigation({
    disabled,
    isSaving,
    localFormData,
    handleInputChange,
    handleSaveData,
    onNext,
    toast
  });

  const {
    existingFiles,
    loadingFiles,
    handleFileDownload
  } = useSection3Files({
    proposalIdForFiles,
    organizationDataForFiles,
    componentMountedRef,
    formData,
    toast
  });

  const {
    handleAutoFill,
    handleClearFields,
    handleQuickTest,
    handleTestNavigation,
    handleDirectNavigationTest,
    handleBackendTest,
    handleSaveTest
  } = useSection3Debug({
    setLocalFormData,
    setFilePreviews,
    handleSaveData,
    handleNext,
    onNext,
    toast
  });

  // Enhanced file upload handler that includes formData
  const handleFileUploadWithFormData = (e, fieldName) => {
    handleFileUpload(e, fieldName, formData);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
              Section 3 of 5: School Event Details
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
              Provide comprehensive details about your proposed school-based event.
            </CardDescription>
          </div>
          {disabled && (
            <div className="flex items-center text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 rounded-md font-medium self-start sm:self-center">
              <LockIcon className="h-4 w-4 mr-2" />
              <span>Read-only Mode</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {formData.proposalStatus === "denied" && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300">
            <InfoIcon className="h-5 w-5" />
            <AlertDescription className="text-sm">
              {formData.adminComments || "The admin has requested revisions. Please update the required information and resubmit."}
            </AlertDescription>
          </Alert>
        )}

        {/* 🆕 Modular form sections */}
        <BasicInfoSection
          localFormData={localFormData}
          handleLocalInputChange={handleLocalInputChange}
          validationErrors={validationErrors}
          disabled={disabled}
        />

        <DateTimeSection
          localFormData={localFormData}
          handleLocalInputChange={handleLocalInputChange}
          handleDateChange={handleDateChange}
          validationErrors={validationErrors}
          disabled={disabled}
        />

        <EventSpecificsSection
          localFormData={localFormData}
          handleRadioChange={handleRadioChange}
          handleTargetAudienceChange={handleTargetAudienceChange}
          validationErrors={validationErrors}
          disabled={disabled}
        />

        <AttachmentsSection
          localFormData={localFormData}
          filePreviews={filePreviews}
          existingFiles={existingFiles}
          loadingFiles={loadingFiles}
          handleFileUpload={handleFileUploadWithFormData}
          handleFileRemoval={handleFileRemoval}
          handleFileDownload={handleFileDownload}
          validationErrors={validationErrors}
          disabled={disabled}
        />

        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200 rounded-lg">
          <InfoIcon className="h-5 w-5" />
          <AlertDescription className="text-sm">
            All fields marked with <span className="text-red-500 font-semibold">*</span> are mandatory.
            Ensure all documents are correctly named and in the specified formats before submission.
          </AlertDescription>
        </Alert>

        {/* 🔧 DEBUG PANEL: Show data recovery status */}
        {process.env.NODE_ENV === 'development' && (
          <DebugPanel
            formData={formData}
            localStorageFormData={localStorageFormData}
            recoveryAttempted={recoveryAttempted}
            componentMountedRef={componentMountedRef}
            onNext={onNext}
            handleAutoFill={handleAutoFill}
            handleClearFields={handleClearFields}
            handleQuickTest={handleQuickTest}
            handleTestNavigation={handleTestNavigation}
            handleDirectNavigationTest={handleDirectNavigationTest}
            handleBackendTest={handleBackendTest}
            handleSaveTest={handleSaveTest}
            toast={toast}
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onPrevious} disabled={disabled || isSaving} className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-cedo-blue dark:focus:ring-cedo-gold">
            Back to Section 2
          </Button>
          {!disabled && (
            <Button variant="destructive" onClick={onWithdraw} disabled={isSaving} className="w-full sm:w-auto">
              Withdraw Proposal
            </Button>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {!disabled && (
            <Button
              variant="outline"
              onClick={() => handleSaveData(true)}
              disabled={isSaving}
              className="w-full sm:w-auto border-cedo-blue text-cedo-blue hover:bg-cedo-blue hover:text-white dark:border-cedo-gold dark:text-cedo-gold dark:hover:bg-cedo-gold dark:hover:text-cedo-blue"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                'Save Progress'
              )}
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={disabled || isSaving}
            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white w-full sm:w-auto dark:bg-cedo-gold dark:text-cedo-blue dark:hover:bg-cedo-gold/90 focus:ring-offset-2 focus:ring-2 focus:ring-cedo-blue dark:focus:ring-cedo-gold"
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              'Save & Continue to Section 5'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// 🛡️ ANTI-DOUBLE-RENDER: Memoize component to prevent unnecessary re-renders
export const Section3_SchoolEvent = React.memo(Section3_SchoolEventComponent);

Section3_SchoolEvent.displayName = 'Section3_SchoolEvent';

export default Section3_SchoolEvent;
