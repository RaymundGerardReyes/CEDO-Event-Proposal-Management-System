import Image from "next/image"
import { cn } from "@/lib/utils"

export function ResponsiveMedia({
  src,
  alt,
  width,
  height,
  className,
  aspectRatio = "aspect-video",
  priority = false,
  type = "image",
}) {
  if (type === "video") {
    return (
      <div className={cn("overflow-hidden rounded-md", aspectRatio, className)}>
        <video src={src} className="h-full w-full object-cover" controls preload="metadata" />
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-md", aspectRatio, className)}>
      <Image
        src={src || "/placeholder.svg"}
        alt={alt || ""}
        width={width || 1200}
        height={height || 800}
        className="h-full w-full object-cover"
        priority={priority}
      />
    </div>
  )
}
