// frontend/src/components/dashboard/student/file-uploader.jsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileText, ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export function FileUploader({
  files = [],
  setFiles,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
  showPreview = true,
}) {
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      setError(null);

      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files.`);
        return;
      }

      const currentAcceptedFiles = [];
      const currentRejectedFiles = [...fileRejections]; // Keep track of rejections from dropzone

      acceptedFiles.forEach(file => {
        if (file.size > maxSize) {
          currentRejectedFiles.push({ file, errors: [{ code: "file-too-large", message: `File is larger than ${maxSize / (1024 * 1024)}MB` }] });
        } else {
          currentAcceptedFiles.push(file);
        }
      });


      if (currentRejectedFiles.length > 0) {
        const errorMessages = currentRejectedFiles.map(rejection =>
          `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
        ).join('; ');
        setError(`Some files were rejected: ${errorMessages}`);
        // Optionally, you might want to only proceed with non-rejected files or stop entirely
      }

      if (currentAcceptedFiles.length === 0 && currentRejectedFiles.length > 0) {
        return; // No valid files to process
      }


      // Simulate upload progress for each file
      const newFiles = [...currentAcceptedFiles];
      const newProgress = { ...uploadProgress };

      newFiles.forEach((file) => {
        newProgress[file.name] = 0;
        simulateUploadProgress(file.name);
      });

      setUploadProgress(newProgress);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    },
    [files, setFiles, maxFiles, maxSize, uploadProgress], // Added uploadProgress to dependencies
  );

  const simulateUploadProgress = (fileName) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: progress,
      }));
    }, 200);
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    // maxFiles prop for useDropzone is handled manually above to provide a single error message.
  });

  const removeFile = (index) => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    if (removedFile) {
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[removedFile.name];
        return newProgress;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (file.type.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (file.type.includes("excel") || file.type.includes("spreadsheet")) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (file.type.includes("word") || file.type.includes("document")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderPreview = (file) => { // Removed index as it's not used
    if (!showPreview || !file.type.startsWith("image/")) return null;
    const previewUrl = URL.createObjectURL(file);
    return (
      <div className="mt-2 relative">
        <img
          src={previewUrl}
          alt={`Preview of ${file.name}`}
          className="h-20 w-auto rounded border border-gray-200"
          onLoad={() => URL.revokeObjectURL(previewUrl)} // Revoke on load
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${isDragActive && isDragAccept
            ? "border-green-500 bg-green-50"
            : isDragActive && isDragReject
              ? "border-red-500 bg-red-50"
              : "border-muted-foreground/20 hover:bg-muted/10"
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="font-medium">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground">
            or click to browse (max {maxFiles} files, {maxSize / (1024 * 1024)}MB each)
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-2">
            Select Files
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={file.name + '-' + index} className="flex flex-col rounded-md border p-3"> {/* Ensure unique key */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] === 100 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="w-20">
                        <Progress value={uploadProgress[file.name] || 0} className="h-2" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-500"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {renderPreview(file)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}