"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField } from "@/components/responsive-form"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function InputField({
  label,
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  required,
  className,
  layout = "vertical",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required} layout={layout}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={type === "password" && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn(error && "border-destructive", className)}
          {...props}
        />
        {type === "password" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </Button>
        )}
      </div>
    </FormField>
  )
}

export function TextareaField({
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  error,
  hint,
  required,
  className,
  layout = "vertical",
  ...props
}) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required} layout={layout}>
      <Textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
    </FormField>
  )
}

export function SelectField({
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  options,
  error,
  hint,
  required,
  className,
  layout = "vertical",
  ...props
}) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required} layout={layout}>
      <Select value={value} onValueChange={onChange} {...props}>
        <SelectTrigger id={id} className={cn(error && "border-destructive", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}

export function CheckboxField({ label, id, name, checked, onChange, error, hint, className, ...props }) {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={onChange}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-destructive",
          )}
        >
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

export function RadioField({
  label,
  name,
  options,
  value,
  onChange,
  error,
  hint,
  required,
  layout = "vertical",
  orientation = "vertical", // vertical or horizontal
  ...props
}) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} layout={layout}>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className={cn(
          orientation === "horizontal" && "flex flex-wrap gap-4",
          orientation === "vertical" && "space-y-2",
        )}
        {...props}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
            <label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  )
}

export function DatePickerField({
  label,
  id,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  className,
  layout = "vertical",
  ...props
}) {
  const [date, setDate] = useState(value ? new Date(value) : undefined)

  const handleSelect = (newDate) => {
    setDate(newDate)
    if (onChange) {
      onChange(newDate)
    }
  }

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required} layout={layout}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-destructive",
              className,
            )}
            {...props}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent mode="single" selected={date} onSelect={handleSelect} initialFocus />
        </PopoverContent>
      </Popover>
    </FormField>
  )
}
