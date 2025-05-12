"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FileUploader({
  files,
  setFiles,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  acceptedFileTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
}) {
  const [error, setError] = useState(null)

  const onDrop = useCallback(
    (acceptedFiles) => {
      setError(null)

      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files`)
        return
      }

      const oversizedFiles = acceptedFiles.filter((file) => file.size > maxSize)
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the ${maxSize / (1024 * 1024)}MB limit`)
        return
      }

      // Check file types if specified
      if (acceptedFileTypes.length > 0) {
        const invalidFiles = acceptedFiles.filter((file) => {
          const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
          return !acceptedFileTypes.includes(fileExtension)
        })

        if (invalidFiles.length > 0) {
          setError(`Some files have invalid formats. Accepted formats: ${acceptedFileTypes.join(", ")}`)
          return
        }
      }

      setFiles([...files, ...acceptedFiles])
    },
    [files, setFiles, maxFiles, maxSize, acceptedFileTypes],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      acceptedFileTypes.length > 0
        ? acceptedFileTypes.reduce((acc, type) => {
            acc[type] = []
            return acc
          }, {})
        : undefined,
  })

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="font-medium">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground">
            or click to browse (max {maxFiles} files, {maxSize / (1024 * 1024)}MB each)
          </p>
          <p className="text-xs text-muted-foreground">Accepted formats: {acceptedFileTypes.join(", ")}</p>
          <Button type="button" variant="outline" size="sm" className="mt-2">
            Select Files
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
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
              <div key={index} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={100} className="w-20 h-2" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
