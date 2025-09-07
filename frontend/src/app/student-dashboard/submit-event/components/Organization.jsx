/**
 * Enhanced StepOrganizer Component
 * Section 2 - Organizer & Contact with modern UI/UX
 * 
 * Key approaches: react-hook-form integration, organization autocomplete, enhanced UX
 */

"use client";

import {
    AlertCircle,
    Building2,
    CheckCircle,
    FileText,
    Mail,
    Phone,
    User,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useEventForm } from '../contexts/EventFormContext';

// Mock organization data - in real app, this would come from API
const MOCK_ORGANIZATIONS = [
    { name: 'SLP Scholars Association', type: 'Student Organization', verified: true },
    { name: 'Community Health Initiative', type: 'NGO', verified: true },
    { name: 'Student Leadership Council', type: 'Student Government', verified: true },
    { name: 'Environmental Awareness Group', type: 'Student Organization', verified: true },
    { name: 'Cultural Heritage Society', type: 'Cultural Organization', verified: true },
    { name: 'Technology Innovation Club', type: 'Student Organization', verified: false },
    { name: 'Sports and Recreation Committee', type: 'Student Organization', verified: true },
    { name: 'Academic Excellence Society', type: 'Student Organization', verified: true }
];

export default function StepOrganizer({ methods, onNext, onPrevious, isLastStep }) {
    const { register, formState: { errors }, watch, setValue, trigger } = useFormContext();
    const { eventUuid, getShortUuid, getFormAge } = useEventForm();
    const [organizationSuggestions, setOrganizationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState(null);

    const watchedValues = watch();

    const handleOrganizationChange = (value) => {
        setValue('organizationName', value);

        if (value.length > 2) {
            const filtered = MOCK_ORGANIZATIONS.filter(org =>
                org.name.toLowerCase().includes(value.toLowerCase())
            );
            setOrganizationSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setSelectedOrganization(null);
        }
    };

    const handleOrganizationSelect = (org) => {
        setValue('organizationName', org.name);
        setSelectedOrganization(org);
        setShowSuggestions(false);
    };

    const isStepValid = () => {
        return watchedValues.organizationName &&
            watchedValues.contactPerson &&
            watchedValues.contactEmail;
    };

    return (
        <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organizer & Contact</h2>
                <p className="text-gray-600">Provide organization and contact information</p>

                {/* UUID Display */}
                {eventUuid && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Event ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">{getShortUuid()}</code>
                            <span className="ml-2 text-blue-600">• Created {getFormAge()}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                {/* Organization Name */}
                <div className="space-y-2">
                    <label htmlFor="organizationName" className="block text-sm font-semibold text-gray-700">
                        Organization Name *
                    </label>
                    <div className="relative">
                        <input
                            id="organizationName"
                            type="text"
                            {...register('organizationName')}
                            onChange={(e) => handleOrganizationChange(e.target.value)}
                            placeholder="Enter organization name"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.organizationName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                        {/* Organization suggestions dropdown */}
                        {showSuggestions && organizationSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {organizationSuggestions.map((org, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                        onClick={() => handleOrganizationSelect(org)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{org.name}</div>
                                                <div className="text-sm text-gray-500">{org.type}</div>
                                            </div>
                                            {org.verified && (
                                                <div className="flex items-center text-green-600 text-sm">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Verified
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.organizationName && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.organizationName.message}
                        </div>
                    )}

                    {/* Selected Organization Info */}
                    {selectedOrganization && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {selectedOrganization.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        {selectedOrganization.type}
                                        {selectedOrganization.verified && ' • Verified Organization'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                    <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700">
                        Contact Person *
                    </label>
                    <div className="relative">
                        <input
                            id="contactPerson"
                            type="text"
                            {...register('contactPerson')}
                            placeholder="Full name of primary contact"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.contactPerson && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactPerson.message}
                        </div>
                    )}
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                    <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700">
                        Contact Email *
                    </label>
                    <div className="relative">
                        <input
                            id="contactEmail"
                            type="email"
                            {...register('contactEmail')}
                            placeholder="contact@organization.com"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.contactEmail && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactEmail.message}
                        </div>
                    )}
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                    <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700">
                        Contact Phone
                    </label>
                    <div className="relative">
                        <input
                            id="contactPhone"
                            type="tel"
                            {...register('contactPhone')}
                            placeholder="+1 (555) 123-4567"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.contactPhone && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.contactPhone.message}
                        </div>
                    )}
                    <p className="text-sm text-gray-500">
                        Optional: Provide phone number for urgent communications
                    </p>
                </div>

                {/* Organization Registration Number */}
                <div className="space-y-2">
                    <label htmlFor="organizationRegistrationNo" className="block text-sm font-semibold text-gray-700">
                        Organization Registration Number
                    </label>
                    <div className="relative">
                        <input
                            id="organizationRegistrationNo"
                            type="text"
                            {...register('organizationRegistrationNo')}
                            placeholder="Registration number (if applicable)"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.organizationRegistrationNo ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.organizationRegistrationNo && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.organizationRegistrationNo.message}
                        </div>
                    )}
                    <p className="text-sm text-gray-500">
                        Optional: Provide if your organization is officially registered with government agencies
                    </p>
                </div>
            </div>

            {/* Step Validation Status */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {isStepValid() ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        )}
                        <div>
                            <h4 className="font-medium text-gray-900">Step 2 Progress</h4>
                            <p className="text-sm text-gray-600">
                                Complete all required fields to proceed
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isStepValid()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isStepValid() ? 'Complete' : 'Incomplete'}
                    </div>
                </div>
            </div>
        </div>
    );
}
