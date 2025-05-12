"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext(null)

function Dialog({ children, open, onOpenChange }) {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = React.useCallback(
    (value) => {
      setIsOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange],
  )

  if (!isOpen) return null

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50">
        <div className="min-w-[32rem] rounded-lg bg-background p-6 shadow-lg" role="dialog">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  )
}

function DialogContent({ className, children, ...props }) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4 space-y-1.5 text-center sm:text-left", className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return (
    <div className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
  )
}

function DialogTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }
