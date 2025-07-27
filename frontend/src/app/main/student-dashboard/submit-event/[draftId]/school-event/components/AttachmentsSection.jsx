import { Button } from "@/components/dashboard/student/ui/button";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { cn } from "@/lib/utils";
import { Download, FileText, Paperclip, UploadCloud, X } from "lucide-react";
import { hasFieldError } from "../../../validation";

/**
 * Attachments Section Component
 */
export const AttachmentsSection = ({
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
    const renderFieldError = (fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    };

    // Enhanced file preview component
    const renderFilePreview = (fileField) => {
        const localFile = filePreviews[fileField.name];
        const existingFile = existingFiles[fileField.type];
        const hasLocalFile = Boolean(localFile);
        const hasExistingFile = Boolean(existingFile);
        const hasAnyFile = hasLocalFile || hasExistingFile;

        // Show file info if we have either local or existing file
        if (hasAnyFile) {
            const displayFileName = localFile || existingFile?.originalName || existingFile?.filename;
            const fileSize = existingFile?.size;
            const uploadDate = existingFile?.uploadedAt;

            return (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <FileText className="h-5 w-5 text-cedo-blue dark:text-cedo-gold flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {displayFileName}
                                </p>
                                {fileSize && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(fileSize / 1024 / 1024).toFixed(2)} MB
                                        {uploadDate && ` • Uploaded ${new Date(uploadDate).toLocaleDateString()}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            {hasExistingFile && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFileDownload(fileField.type)}
                                    className="text-cedo-blue dark:text-cedo-gold border-cedo-blue dark:border-cedo-gold hover:bg-cedo-blue hover:text-white dark:hover:bg-cedo-gold dark:hover:text-cedo-blue"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            )}
                            {hasLocalFile && !disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileRemoval(fileField.name);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">
                Attachments
                {loadingFiles && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Loading existing files...)
                    </span>
                )}
            </legend>
            {[
                { label: "General Plan of Action (GPOA)", name: "school_gpoa_file", type: "gpoa", hint: "Filename: OrganizationName_GPOA.pdf/docx/xlsx" },
                { label: "Project Proposal Document", name: "school_proposal_file", type: "proposal", hint: "Filename: OrganizationName_PP.pdf/docx/xlsx. Must include summary, objectives, timeline, budget." }
            ].map(fileField => {
                const hasLocalFile = Boolean(filePreviews[fileField.name]);
                const hasExistingFile = Boolean(existingFiles[fileField.type]);
                const hasAnyFile = hasLocalFile || hasExistingFile;

                return (
                    <div key={fileField.name} className="space-y-2">
                        <Label htmlFor={fileField.name} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                            {fileField.label} <span className="text-red-500 ml-0.5">*</span>
                            {hasExistingFile && (
                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    Uploaded
                                </span>
                            )}
                        </Label>

                        {/* Upload Area */}
                        <div className={cn("mt-1 group relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ease-in-out hover:border-cedo-blue dark:border-gray-600 dark:hover:border-cedo-gold",
                            disabled && "opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50",
                            hasFieldError(fileField.name, validationErrors) && "border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-600 bg-red-50 dark:bg-red-900/30",
                            hasAnyFile && !hasFieldError(fileField.name, validationErrors) && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 hover:border-green-600 dark:hover:border-green-600"
                        )}>
                            <Label htmlFor={fileField.name} className={cn("cursor-pointer w-full flex flex-col items-center justify-center", disabled && "cursor-not-allowed")}>
                                <UploadCloud className={cn("h-10 w-10 mb-2 text-gray-400 dark:text-gray-500 group-hover:text-cedo-blue dark:group-hover:text-cedo-gold transition-colors", hasAnyFile && !hasFieldError(fileField.name, validationErrors) && "text-green-600 dark:text-green-500")} />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {hasLocalFile ? (
                                        <span className="flex items-center gap-2 text-cedo-blue dark:text-cedo-gold">
                                            <Paperclip className="h-4 w-4 flex-shrink-0" /> {filePreviews[fileField.name]}
                                        </span>
                                    ) : hasExistingFile ? (
                                        <span className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            File uploaded to database
                                        </span>
                                    ) : (
                                        <>Drag & drop or <span className="font-semibold text-cedo-blue dark:text-cedo-gold">click to browse</span></>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{fileField.hint}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Max 10MB. Allowed: PDF, Word, Excel.</p>
                            </Label>
                            <Input
                                id={fileField.name}
                                name={fileField.name}
                                type="file"
                                className="sr-only"
                                onChange={(e) => handleFileUpload(e, fileField.name)}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                disabled={disabled}
                            />
                            {hasLocalFile && !disabled && (
                                <Button type="button" variant="ghost" size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileRemoval(fileField.name);
                                    }}
                                    aria-label={`Remove ${fileField.label}`}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* File Preview/Download Area */}
                        {renderFilePreview(fileField)}

                        {renderFieldError(fileField.name)}
                    </div>
                );
            })}
        </fieldset>
    );
}; 