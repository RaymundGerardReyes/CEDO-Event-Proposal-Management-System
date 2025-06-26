"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { Controller } from "react-hook-form"

const FormFieldContext = React.createContext({})

const FormItemContext = React.createContext({})

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  // Get fieldState from the provided formState and getFieldState function
  const fieldState = fieldContext.getFieldState ?
    fieldContext.getFieldState(fieldContext.name, fieldContext.formState) :
    fieldContext.fieldState

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    fieldState,
    ...fieldState,
  }
}

/**
 * Form wrapper component that filters out react-hook-form props
 * to prevent React warnings about unrecognized DOM props.
 * 
 * This component accepts all react-hook-form props but only passes
 * valid DOM props to the underlying div element.
 */
const Form = ({ children, ...props }) => {
  // Filter out react-hook-form specific props to prevent React warnings
  // about unrecognized props on DOM elements
  const {
    handleSubmit,
    control,
    formState,
    register,
    watch,
    setValue,
    getValues,
    reset,
    clearErrors,
    setError,
    trigger,
    getFieldState,
    resetField,
    unregister,
    setFocus,
    getFieldsValue,
    subscribe,
    _reset,
    _getWatch,
    _getDirty,
    _getFieldArray,
    _subjects,
    _proxyFormState,
    _updateFormState,
    _options,
    _formControl,
    _stateRef,
    _removeUnmounted,
    _names,
    _state,
    _defaultValues,
    _getIsDirty,
    ...domProps
  } = props;

  return <div {...domProps}>{children}</div>
}

const FormField = ({ control, name, render, ...props }) => {
  return (
    <FormFieldContext.Provider value={{ name, control }}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState, formState }) => {
          return (
            <FormFieldContext.Provider
              value={{
                name,
                control,
                fieldState,
                formState,
                getFieldState: control._getFieldState || control.getFieldState,
              }}
            >
              {render({ field, fieldState, formState })}
            </FormFieldContext.Provider>
          )
        }}
        {...props}
      />
    </FormFieldContext.Provider>
  )
}

const FormItem = React.forwardRef(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ ...props }, ref) => <div ref={ref} className="mt-2" {...props} />)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  if (!children) {
    return null
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage }

