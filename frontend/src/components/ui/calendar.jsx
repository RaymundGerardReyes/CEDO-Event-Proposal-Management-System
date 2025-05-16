"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  highlightedDates = [],
  showOutsideDays = true,
}) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date())
  const [calendarDays, setCalendarDays] = useState([])

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (42 = 6 rows of 7 days)
    const totalDays = 42

    // Generate array of calendar days
    const days = []

    // Add days from previous month if showOutsideDays is true
    if (showOutsideDays) {
      const prevMonth = new Date(year, month, 0)
      const prevMonthDays = prevMonth.getDate()

      for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
        days.push({
          date: new Date(year, month - 1, i),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          isHighlighted: false,
        })
      }
    }

    // Add days from current month
    const daysInMonth = lastDay.getDate()
    const today = new Date()

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      const isSelected =
        selected &&
        date.getDate() === selected.getDate() &&
        date.getMonth() === selected.getMonth() &&
        date.getFullYear() === selected.getFullYear()

      const isHighlighted = highlightedDates.some(
        (highlightedDate) =>
          highlightedDate.getDate() === date.getDate() &&
          highlightedDate.getMonth() === date.getMonth() &&
          highlightedDate.getFullYear() === date.getFullYear(),
      )

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isHighlighted,
      })
    }

    // Add days from next month if needed to fill the calendar
    if (showOutsideDays) {
      const remainingDays = totalDays - days.length

      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          isHighlighted: false,
        })
      }
    }

    setCalendarDays(days)
  }, [currentMonth, selected, highlightedDates, showOutsideDays])

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Handle date selection
  const handleDateSelect = (date) => {
    if (onSelect) {
      onSelect(date)
    }
  }

  // Format month and year for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Days of the week
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">{formatMonthYear(currentMonth)}</div>

          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-full border-collapse space-y-1">
          <div className="flex">
            {weekdays.map((day) => (
              <div key={day} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={cn("h-9 w-9 p-0 relative", day.isCurrentMonth ? "" : "text-muted-foreground opacity-50")}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 p-0 font-normal",
                    day.isToday && "bg-accent text-accent-foreground",
                    day.isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day.isHighlighted && !day.isSelected && "bg-blue-100 text-blue-800",
                  )}
                  onClick={() => handleDateSelect(day.date)}
                  disabled={!day.isCurrentMonth && !showOutsideDays}
                >
                  {day.date.getDate()}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
