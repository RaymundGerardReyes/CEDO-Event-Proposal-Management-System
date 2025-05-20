"use client"

import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export function ResponsiveTable({ headers, data, renderRow, className, emptyState, keyField = "id" }) {
  const { isMobile } = useMobile()

  if (data.length === 0) {
    return (
      emptyState || (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      )
    )
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.map((item) => (
          <div key={item[keyField]} className="border rounded-md p-4 bg-white shadow-sm">
            {headers.map((header) => (
              <div key={header.key} className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-sm">{header.label}</span>
                <span className="text-sm">
                  {header.render ? header.render(item[header.key], item) : item[header.key]}
                </span>
              </div>
            ))}
            {renderRow && renderRow(item)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {headers.map((header) => (
              <th key={header.key} className={cn("text-left py-3 px-4 font-medium text-sm", header.className)}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item[keyField]} className="border-b hover:bg-gray-50">
              {headers.map((header) => (
                <td key={`${item[keyField]}-${header.key}`} className={cn("py-3 px-4", header.cellClassName)}>
                  {header.render ? header.render(item[header.key], item) : item[header.key]}
                </td>
              ))}
              {renderRow && renderRow(item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
