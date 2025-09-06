/**
 * Enhanced Submit Event Page - Production Ready
 * Modern Event Approval Form SPA with advanced features
 * 
 * Key approaches: react-hook-form + zod validation, code splitting, enhanced UX
 */

"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import {
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Info,
    MapPin,
    Save,
    Shield,
    Users
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// Dynamic imports for code splitting
const Overview = dynamic(() => import('./components/Overview'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const Organization = dynamic(() => import('./components/Organization'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const EventInformation = dynamic(() => import('./components/EventInformation'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const Program = dynamic(() => import('./components/Program'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const Reports = dynamic(() => import('./components/Reports'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const PostEventReport = dynamic(() => import('./components/PostEventReport'), {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

// Enhanced validation schema with zod
const eventFormSchema = z.object({
    // Step 1 - Overview
    title: z.string().min(1, 'Event title is required').max(150, 'Title must be less than 150 characters'),
    description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must be less than 2000 characters'),
    eventType: z.string().min(1, 'Event type is required'),
    targetAudience: z.array(z.string()).optional(),
    requestedSdpCredits: z.number().min(0.5, 'Minimum 0.5 SDP credits required').max(10, 'Maximum 10 SDP credits allowed'),
    expectedParticipants: z.number().min(1, 'At least 1 participant required').max(1000, 'Maximum 1000 participants allowed'),

    // Step 2 - Organizer
    organizationName: z.string().min(1, 'Organization name is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().optional(),
    organizationRegistrationNo: z.string().optional(),

    // Step 3 - Logistics
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    venueId: z.string().min(1, 'Venue selection is required'),
    venueCapacity: z.number().min(1, 'Venue capacity is required'),
    onlineHybrid: z.boolean().default(false),
    meetingLink: z.string().optional(),
    equipment: z.array(z.string()).optional(),
    budgetEstimate: z.number().min(0).optional(),

    // Step 4 - Program
    agenda: z.array(z.object({
        time: z.string().min(1, 'Time is required'),
        activity: z.string().min(1, 'Activity is required'),
        facilitator: z.string().min(1, 'Facilitator is required')
    })).min(1, 'At least one agenda item is required'),
    facilitators: z.array(z.object({
        name: z.string().min(1, 'Facilitator name is required'),
        role: z.string().min(1, 'Role is required'),
        isExternal: z.boolean().default(false),
        cvUploaded: z.boolean().default(false)
    })).min(1, 'At least one facilitator is required'),
    learningObjectives: z.array(z.string()).min(3, 'At least 3 learning objectives are required').max(10, 'Maximum 10 learning objectives allowed'),
    supportingMaterials: z.array(z.any()).optional(),

    // Step 5 - Risk & Attachments
    riskLevel: z.enum(['low', 'medium', 'high'], { required_error: 'Risk level is required' }),
    riskJustification: z.string().optional(),
    permitsRequired: z.boolean().default(false),
    permitStatus: z.string().optional(),
    permits: z.array(z.any()).optional(),
    conflictOfInterest: z.boolean().default(false),
    conflictDescription: z.string().optional(),
    mitigationPlan: z.string().optional(),
    declarationSignature: z.string().min(1, 'Declaration signature is required'),
    declarationAccepted: z.boolean().refine(val => val === true, 'Declaration must be accepted')
}).refine((data) => {
    // Conditional validation for online/hybrid events
    if (data.onlineHybrid && !data.meetingLink) {
        return false;
    }
    return true;
}, {
    message: "Meeting link is required for online/hybrid events",
    path: ["meetingLink"]
}).refine((data) => {
    // Conditional validation for risk justification
    if ((data.riskLevel === 'medium' || data.riskLevel === 'high') && !data.riskJustification) {
        return false;
    }
    return true;
}, {
    message: "Risk justification is required for medium/high risk events",
    path: ["riskJustification"]
});

// Enhanced step configuration with icons and progress tracking
const steps = [
    {
        id: 1,
        name: 'Overview',
        description: 'Event basic information',
        icon: Info
    },
    {
        id: 2,
        name: 'Organization',
        description: 'Organization details',
        icon: Users

    },
    {
        id: 3,
        name: 'Event Information',
        description: 'Date, venue, and logistics',
        icon: MapPin

    },
    {
        id: 4,
        name: 'Review',
        description: 'Agenda and deliverables',
        icon: Calendar
    },
    {
        id: 5,
        name: 'Reports',
        description: 'Accomplishment Reports and Documentation',
        icon: Shield

    }
];

export default function EnhancedSubmitEventPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedPath, setSelectedPath] = useState(null); // 'event-proposal' or 'post-event-report'
    const [isReportsSubmitted, setIsReportsSubmitted] = useState(false);

    // Enhanced form setup with react-hook-form
    const methods = useForm({
        resolver: zodResolver(eventFormSchema),
        mode: 'onChange',
        defaultValues: {
            targetAudience: [],
            requestedSdpCredits: 1,
            expectedParticipants: 1,
            onlineHybrid: false,
            equipment: [],
            budgetEstimate: 0,
            agenda: [{ time: '', activity: '', facilitator: '' }],
            facilitators: [{ name: '', role: '', isExternal: false, cvUploaded: false }],
            learningObjectives: ['', '', ''],
            supportingMaterials: [],
            permitsRequired: false,
            permits: [],
            conflictOfInterest: false,
            declarationAccepted: false
        }
    });

    const { handleSubmit, formState: { errors, isValid, isDirty }, watch, trigger } = methods;
    const watchedValues = watch();

    // Handle path selection from Overview component
    const handlePathSelect = (path) => {
        setSelectedPath(path);
        if (path === 'organization') {
            // Start Event Proposal path - go to Organization (Step 2)
            // But first ensure we're in the event proposal flow (not step 0)
            setCurrentStep(2);
            // Mark step 1 as completed since user has made the choice to proceed
            setCompletedSteps(prev => [...new Set([...prev, 1])]);
        } else if (path === 'post-event-report') {
            // Post Event Report path - show PostEventReport component
            setCurrentStep(0); // Special step for post-event report
        }
    };

    // Handle Reports submission completion
    const handleReportsSubmitted = (isSubmitted) => {
        setIsReportsSubmitted(isSubmitted);
        if (isSubmitted) {
            // Mark Reports step (step 5) as completed when submitted
            setCompletedSteps(prev => [...new Set([...prev, 5])]);
        } else {
            // Remove Reports step from completed when reset
            setCompletedSteps(prev => prev.filter(id => id !== 5));
        }
    };

    // Auto-save functionality with debouncing
    useEffect(() => {
        if (!isDirty) return;

        const timeoutId = setTimeout(async () => {
            try {
                // Simulate auto-save API call
                await new Promise(resolve => setTimeout(resolve, 500));
                setLastSaved(new Date());
                console.log('Auto-saved at:', new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [watchedValues, isDirty]);

    // Step validation and completion tracking
    const validateStep = useCallback(async (stepId) => {
        const step = steps.find(s => s.id === stepId);
        if (!step) return false;

        // Skip validation for steps without fields (like Overview)
        if (!step.fields || step.fields.length === 0) {
            setCompletedSteps(prev => [...new Set([...prev, stepId])]);
            return true;
        }

        const fieldsToValidate = step.fields;
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setCompletedSteps(prev => [...new Set([...prev, stepId])]);
        } else {
            setCompletedSteps(prev => prev.filter(id => id !== stepId));
        }

        return isValid;
    }, [trigger]);

    // Enhanced step navigation with validation
    const goToStep = useCallback(async (stepId) => {
        if (stepId < currentStep) {
            setCurrentStep(stepId);
            return;
        }

        // Validate current step before proceeding
        const isCurrentStepValid = await validateStep(currentStep);
        if (isCurrentStepValid || stepId <= currentStep) {
            setCurrentStep(stepId);
        } else {
            // Show validation errors
            console.log('Please complete current step before proceeding');
        }
    }, [currentStep, validateStep]);

    // Enhanced form submission
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Simulate API submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Form submitted:', data);
            alert('Event submitted successfully!');
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render current step component
    const renderCurrentStep = () => {
        // Handle post-event report path
        if (currentStep === 0) {
            return (
                <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>}>
                    <PostEventReport
                        onBack={() => {
                            setSelectedPath(null);
                            setCurrentStep(1);
                        }}
                    />
                </Suspense>
            );
        }

        // Handle event proposal stepper path
        const StepComponent = {
            1: Overview,
            2: Organization,
            3: EventInformation,
            4: Program,
            5: Reports
        }[currentStep];

        if (!StepComponent) return null;

        return (
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>}>
                <StepComponent
                    methods={methods}
                    onNext={() => goToStep(currentStep + 1)}
                    onPrevious={() => goToStep(currentStep - 1)}
                    isLastStep={currentStep === steps.length}
                    onPathSelect={handlePathSelect}
                    onReportsSubmitted={handleReportsSubmitted}
                />
            </Suspense>
        );
    };

    // Calculate overall progress
    const progress = (completedSteps.length / steps.length) * 100;

    // Ensure we show progress for event proposal path (currentStep > 0)
    const showProgress = currentStep > 0;

    return (
        <FormProvider {...methods}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Enhanced Header with Progress - Only show for event proposal path */}
                    {showProgress && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Submit Event</h1>
                                    <p className="mt-2 text-gray-600">
                                        Complete all sections to submit your event for approval
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Progress</div>
                                    <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Main content with enhanced layout */}
                    <div>

                        {/* Enhanced Main Form Area */}
                        <main className="lg:col-span-3">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Enhanced Stepper - Only show for event proposal path */}
                                {showProgress && (
                                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                                        <nav aria-label="Event submission progress">
                                            <ol role="list" className="flex items-center justify-between">
                                                {steps.map((step, index) => {
                                                    const isCurrent = step.id === currentStep;
                                                    const isCompleted = completedSteps.includes(step.id);
                                                    const isAccessible = step.id <= currentStep || isCompleted;
                                                    const Icon = step.icon;

                                                    return (
                                                        <li key={step.id} className="flex-1 relative">
                                                            {/* Connection line */}
                                                            {index < steps.length - 1 && (
                                                                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-200 -translate-y-1/2">
                                                                    <div className={`h-full transition-all duration-300 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                                        style={{ width: isCompleted ? '100%' : '0%' }}></div>
                                                                </div>
                                                            )}

                                                            {/* Step button */}
                                                            <button
                                                                type="button"
                                                                className={`relative flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${isCurrent
                                                                    ? 'bg-blue-50 text-blue-600'
                                                                    : isCompleted
                                                                        ? 'text-blue-600 hover:bg-blue-50'
                                                                        : isAccessible
                                                                            ? 'text-gray-500 hover:bg-gray-50'
                                                                            : 'text-gray-300 cursor-not-allowed'
                                                                    }`}
                                                                onClick={() => isAccessible && goToStep(step.id)}
                                                                disabled={!isAccessible}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${isCompleted
                                                                    ? 'bg-blue-600 text-white'
                                                                    : isCurrent
                                                                        ? 'border-2 border-blue-600 bg-white'
                                                                        : 'border-2 border-gray-300 bg-white'
                                                                    }`}>
                                                                    {isCompleted ? (
                                                                        <CheckCircle className="h-5 w-5" />
                                                                    ) : (
                                                                        <Icon className="h-4 w-4" />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-medium text-center">{step.name}</span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        </nav>
                                    </div>
                                )}

                                {/* Step Content */}
                                <div className="p-6">
                                    {renderCurrentStep()}
                                </div>

                                {/* Enhanced Action Buttons - Only show for event proposal path, hide on Overview step, and hide when Reports is submitted */}
                                {showProgress && currentStep !== 1 && !isReportsSubmitted && (
                                    <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                                        <button
                                            type="button"
                                            onClick={() => goToStep(currentStep - 1)}
                                            disabled={currentStep === 1}
                                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Back
                                        </button>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Save className="h-4 w-4 mr-1" />
                                                Save Draft
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowPreview(true)}
                                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Preview
                                            </button>

                                            {/* Hide Next/Complete button only on Reports step (step 5) */}
                                            {currentStep !== 5 && (
                                                <button
                                                    type="button"
                                                    onClick={() => goToStep(currentStep + 1)}
                                                    disabled={currentStep === steps.length}
                                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {currentStep === steps.length ? "Complete" : "Next"}
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </FormProvider>
    );
}
