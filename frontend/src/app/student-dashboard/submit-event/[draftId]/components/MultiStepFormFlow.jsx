/**
 * MultiStepFormFlow Component
 * Multi-step form flow for event proposal submission
 * 
 * Key approaches: Step-based navigation, form state management,
 * progress tracking, and modular section rendering
 */

"use client"

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { use } from 'react';
import { ValidationErrorsAlert } from '../../components';
import EventTypeSelection from '../event-type/EventTypeSelection';
import { STEPS, useMultiStepForm } from '../hooks/useMultiStepForm';
import OrganizationSection from '../organization/OrganizationSection';
import Section1_Overview from '../overview/Section1_Overview';
import { CommunitySpecificSection } from './community/CommunitySpecificSection';
import { SchoolSpecificSection } from './school/SchoolSpecificSection';

// --- Section Renderers ---
function renderOverviewSection(props) {
    return (
        <Section1_Overview
            formData={props.formData}
            onStartProposal={props.onStartProposal}
            onContinueEditing={props.onContinueEditing}
            onViewProposal={props.onViewProposal}
            onSubmitReport={props.onSubmitReport}
        />
    );
}

function renderEventTypeSection(props) {
    return (
        <EventTypeSelection
            onSelect={props.onEventTypeSelect}
            onPrevious={props.onPrevious}
            isSaving={props.isSaving}
        />
    );
}

function renderOrganizationSection(props) {
    // Debug logging for event type
    console.log('🔍 DEBUG renderOrganizationSection:');
    console.log('  - props.formData:', props.formData);
    console.log('  - props.formData?.eventType:', props.formData?.eventType);
    console.log('  - Final eventType prop:', props.formData?.eventType || 'school-based');

    return (
        <>
            {props.hasValidationErrors && <ValidationErrorsAlert errors={props.validationErrors} />}
            <OrganizationSection
                formData={props.formData}
                handleInputChange={props.handleInputChange}
                onNext={props.onNext}
                onPrevious={props.onPrevious}
                disabled={props.loading}
                validationErrors={props.validationErrors}
                eventType={props.formData?.eventType || 'school-based'}
                showOrganizationType={true}
            />
        </>
    );
}

function renderSchoolEventSection(props) {
    return (
        <>
            {props.hasValidationErrors && <ValidationErrorsAlert errors={props.validationErrors} />}
            <SchoolSpecificSection
                formData={props.formData}
                handleInputChange={props.handleInputChange}
                onNext={props.onNext}
                onPrevious={props.onPrevious}
                disabled={props.loading}
                validationErrors={props.validationErrors}
                draftId={props.draftId}
            />
        </>
    );
}

function renderCommunityEventSection(props) {
    return (
        <>
            {props.hasValidationErrors && <ValidationErrorsAlert errors={props.validationErrors} />}
            <CommunitySpecificSection
                formData={props.formData}
                handleInputChange={props.handleInputChange}
                onNext={props.onNext}
                onPrevious={props.onPrevious}
                disabled={props.loading}
                validationErrors={props.validationErrors}
                draftId={props.draftId}
            />
        </>
    );
}

function renderReportingSection(props) {
    return (
        <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Submitted!</h2>
            <p className="text-gray-600 mb-6">
                Your event proposal has been successfully submitted for review.
            </p>
            <div className="space-y-4">
                <Button
                    onClick={props.onSubmitReport}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Submit Report
                </Button>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function MultiStepFormFlow({ params }) {
    const unwrappedParams = use(params);
    const { draftId } = unwrappedParams;

    const {
        currentStep,
        formData,
        validationErrors,
        loading,
        progressPercentage,
        nextStep,
        prevStep,
        updateFormData,
        validateStep,
        handleInputChange,
        goToStep,
        goToNextStep,
        goToPreviousStep,
        handleEventTypeSelect,
        handleOrganizationNext,
        hasValidationErrors
    } = useMultiStepForm(draftId);

    // Overview section handlers
    const handleStartProposal = () => {
        goToStep(1);
    };

    const handleContinueEditing = () => {
        goToStep(1);
    };

    const handleViewProposal = () => {
        goToStep(0);
    };

    const handleSubmitReport = () => {
        goToStep(4);
    };

    // Render current section
    const renderCurrentSection = () => {
        const props = {
            formData,
            handleInputChange,
            validationErrors,
            hasValidationErrors,
            loading,
            draftId,
            goToNextStep,
            goToPreviousStep,
            onEventTypeSelect: handleEventTypeSelect,
            onPrevious: goToPreviousStep,
            onNext: handleOrganizationNext,
            isSaving: loading,
            onStartProposal: handleStartProposal,
            onContinueEditing: handleContinueEditing,
            onViewProposal: handleViewProposal,
            onSubmitReport: handleSubmitReport
        };

        switch (currentStep) {
            case 0:
                return renderOverviewSection(props);
            case 1:
                return renderEventTypeSection(props);
            case 2:
                return renderOrganizationSection(props);
            case 3:
                // Determine if it's school or community event based on form data
                const eventType = formData.eventType;
                console.log('🔍 Step 3 rendering - eventType:', eventType);
                if (eventType === 'community-based') {
                    console.log('🎯 Rendering community event section');
                    return renderCommunityEventSection(props);
                }
                console.log('🎯 Rendering school event section');
                return renderSchoolEventSection(props);
            case 4:
                return renderReportingSection(props);
            default:
                return renderOverviewSection(props);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Event Proposal Submission
                            </h1>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Step {currentStep + 1} of {STEPS.length}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>

                        {/* Step Labels */}
                        <div className="flex justify-between mt-2">
                            {STEPS.map((step, index) => (
                                <div
                                    key={step.name}
                                    className={`flex flex-col items-center ${index <= currentStep
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${index <= currentStep
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className="text-xs mt-1 hidden sm:block">{step.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="p-6">
                        {renderCurrentSection()}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={goToPreviousStep}
                        disabled={currentStep === 0 || loading}
                        className="dark:border-gray-600 dark:text-gray-300"
                    >
                        Previous
                    </Button>

                    <Button
                        onClick={goToNextStep}
                        disabled={currentStep === STEPS.length - 1 || loading}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                </div>
            </div>
        </div>
    );
}