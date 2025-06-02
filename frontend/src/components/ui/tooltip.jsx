// FILE: src/components/ui/tooltip.jsx
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

// Assuming 'cn' utility is available, e.g., from '@/lib/utils'
// If not, you'd need to define it:
// const cn = (...classes) => classes.filter(Boolean).join(' ');
import { cn } from "@/lib/utils"; // Make sure this path is correct

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

// --- Example Usage (Optional - for demonstration) ---
// You would typically import and use these components in another file.

// function App() {
//   return (
//     <div className="p-10 flex justify-center items-center h-screen bg-gray-100 font-sans">
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <button className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
//               Hover over me
//             </button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>This is a tooltip!</p>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//     </div>
//   );
// }
//
// export default App; // If this were the main app file