import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef((props, ref) => {
  return <input ref={ref} className={cn("input", props.className)} {...props} />
})
Input.displayName = "Input"

export { Input }

