"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Download, ExternalLink, Maximize2, Play, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import { forwardRef, useState } from "react"

// Enhanced responsive image component
export const ResponsiveImage = forwardRef(({
  src,
  alt,
  className,
  aspectRatio = "auto", // auto, square, video, portrait, landscape
  objectFit = "cover", // cover, contain, fill, none, scale-down
  priority = false,
  placeholder = "blur",
  blurDataURL,
  sizes,
  quality = 75,
  loading = "lazy",
  overlay = false,
  overlayContent,
  rounded = false,
  shadow = false,
  zoom = false,
  fallback,
  onLoad,
  onError,
  animate = false,
  ...props
}, ref) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const getAspectRatioClasses = () => {
    const ratios = {
      auto: "",
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      landscape: "aspect-[4/3]"
    }
    return ratios[aspectRatio] || ratios.auto
  }

  const getObjectFitClasses = () => {
    const fits = {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
      "scale-down": "object-scale-down"
    }
    return fits[objectFit] || fits.cover
  }

  const imageClasses = cn(
    "w-full h-full transition-all duration-300",
    getObjectFitClasses(),
    zoom && "cursor-zoom-in hover:scale-105",
    isZoomed && "scale-110",
    className
  )

  const containerClasses = cn(
    "relative overflow-hidden",
    getAspectRatioClasses(),
    rounded && "rounded-lg sm:rounded-xl",
    shadow && "shadow-sm sm:shadow-md hover:shadow-lg",
    "group"
  )

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const handleZoom = () => {
    if (zoom) {
      setIsZoomed(!isZoomed)
    }
  }

  const Component = animate ? motion.div : "div"

  if (hasError && fallback) {
    return (
      <Component
        className={containerClasses}
        {...(animate && {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.3 }
        })}
      >
        {fallback}
      </Component>
    )
  }

  return (
    <Component
      ref={ref}
      className={containerClasses}
      onClick={handleZoom}
      {...(animate && {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3 }
      })}
      {...props}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClasses}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {overlayContent || (
            <div className="flex gap-2">
              {zoom && (
                <Button variant="secondary" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Component>
  )
})

ResponsiveImage.displayName = "ResponsiveImage"

// Enhanced responsive video component
export const ResponsiveVideo = forwardRef(({
  src,
  poster,
  className,
  aspectRatio = "video",
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = "metadata",
  rounded = false,
  shadow = false,
  overlay = false,
  overlayContent,
  customControls = false,
  onPlay,
  onPause,
  onEnded,
  animate = false,
  ...props
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [showControls, setShowControls] = useState(false)

  const getAspectRatioClasses = () => {
    const ratios = {
      auto: "",
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      landscape: "aspect-[4/3]"
    }
    return ratios[aspectRatio] || ratios.video
  }

  const containerClasses = cn(
    "relative overflow-hidden",
    getAspectRatioClasses(),
    rounded && "rounded-lg sm:rounded-xl",
    shadow && "shadow-sm sm:shadow-md hover:shadow-lg",
    "group",
    className
  )

  const videoClasses = cn(
    "w-full h-full object-cover"
  )

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  const handlePause = () => {
    setIsPlaying(false)
    onPause?.()
  }

  const handleEnded = () => {
    setIsPlaying(false)
    onEnded?.()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const togglePlay = () => {
    if (ref?.current) {
      if (isPlaying) {
        ref.current.pause()
      } else {
        ref.current.play()
      }
    }
  }

  const Component = animate ? motion.div : "div"

  return (
    <Component
      className={containerClasses}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      {...(animate && {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3 }
      })}
      {...props}
    >
      <video
        ref={ref}
        className={videoClasses}
        poster={poster}
        controls={controls && !customControls}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        preload={preload}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Custom controls overlay */}
      {customControls && (
        <div className={cn(
          "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePlay}
              className="bg-white/90 hover:bg-white"
            >
              <Play className={cn("h-4 w-4", isPlaying && "hidden")} />
              <span className={cn("h-4 w-4", !isPlaying && "hidden")}>⏸</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleMute}
              className="bg-white/90 hover:bg-white"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {overlayContent}
        </div>
      )}
    </Component>
  )
})

ResponsiveVideo.displayName = "ResponsiveVideo"

// Enhanced responsive media gallery
export const ResponsiveMediaGallery = forwardRef(({
  items = [],
  className,
  columns = "auto", // auto, 1, 2, 3, 4, 5, 6
  gap = "default",
  aspectRatio = "square",
  rounded = true,
  shadow = true,
  overlay = true,
  masonry = false,
  lightbox = false,
  animate = false,
  onItemClick,
  ...props
}, ref) => {
  const [selectedItem, setSelectedItem] = useState(null)

  const getColumnClasses = () => {
    if (columns === "auto") {
      return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    }

    const columnMap = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    }

    return columnMap[columns] || columnMap.auto
  }

  const getGapClasses = () => {
    const gaps = {
      none: "gap-0",
      sm: "gap-2 sm:gap-3",
      default: "gap-3 sm:gap-4 md:gap-6",
      lg: "gap-4 sm:gap-6 md:gap-8",
      xl: "gap-6 sm:gap-8 md:gap-10"
    }
    return gaps[gap] || gaps.default
  }

  const galleryClasses = cn(
    masonry ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4" : "grid",
    !masonry && getColumnClasses(),
    getGapClasses(),
    className
  )

  const handleItemClick = (item, index) => {
    if (lightbox) {
      setSelectedItem({ ...item, index })
    }
    onItemClick?.(item, index)
  }

  const Component = animate ? motion.div : "div"

  return (
    <>
      <Component
        ref={ref}
        className={galleryClasses}
        {...(animate && {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: {
            duration: 0.5,
            staggerChildren: 0.1
          }
        })}
        {...props}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            className={cn(
              "cursor-pointer",
              masonry && "break-inside-avoid mb-4"
            )}
            onClick={() => handleItemClick(item, index)}
            {...(animate && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.05 }
            })}
          >
            {item.type === "video" ? (
              <ResponsiveVideo
                src={item.src}
                poster={item.poster}
                aspectRatio={aspectRatio}
                rounded={rounded}
                shadow={shadow}
                overlay={overlay}
                customControls
              />
            ) : (
              <ResponsiveImage
                src={item.src}
                alt={item.alt || `Gallery item ${index + 1}`}
                aspectRatio={aspectRatio}
                rounded={rounded}
                shadow={shadow}
                overlay={overlay}
                overlayContent={
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                }
              />
            )}
          </motion.div>
        ))}
      </Component>

      {/* Lightbox modal */}
      {lightbox && selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </Button>

            {selectedItem.type === "video" ? (
              <ResponsiveVideo
                src={selectedItem.src}
                poster={selectedItem.poster}
                controls
                className="max-h-[80vh]"
              />
            ) : (
              <ResponsiveImage
                src={selectedItem.src}
                alt={selectedItem.alt}
                className="max-h-[80vh] w-auto"
                objectFit="contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
})

ResponsiveMediaGallery.displayName = "ResponsiveMediaGallery"

// Enhanced responsive avatar component
export const ResponsiveAvatar = forwardRef(({
  src,
  alt,
  fallback,
  className,
  size = "default", // xs, sm, default, lg, xl, 2xl
  variant = "circle", // circle, square, rounded
  status,
  statusPosition = "bottom-right", // top-left, top-right, bottom-left, bottom-right
  border = false,
  shadow = false,
  animate = false,
  ...props
}, ref) => {
  const [hasError, setHasError] = useState(false)

  const getSizeClasses = () => {
    const sizes = {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      default: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
      "2xl": "h-20 w-20"
    }
    return sizes[size] || sizes.default
  }

  const getVariantClasses = () => {
    const variants = {
      circle: "rounded-full",
      square: "rounded-none",
      rounded: "rounded-lg"
    }
    return variants[variant] || variants.circle
  }

  const getStatusPositionClasses = () => {
    const positions = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0"
    }
    return positions[statusPosition] || positions["bottom-right"]
  }

  const avatarClasses = cn(
    "relative inline-flex items-center justify-center overflow-hidden bg-muted",
    getSizeClasses(),
    getVariantClasses(),
    border && "border-2 border-background",
    shadow && "shadow-sm",
    className
  )

  const Component = animate ? motion.div : "div"

  return (
    <Component
      ref={ref}
      className={avatarClasses}
      {...(animate && {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 }
      })}
      {...props}
    >
      {src && !hasError ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-muted-foreground font-medium">
          {fallback || alt?.charAt(0)?.toUpperCase() || "?"}
        </span>
      )}

      {/* Status indicator */}
      {status && (
        <span className={cn(
          "absolute block rounded-full ring-2 ring-background",
          getStatusPositionClasses(),
          size === "xs" && "h-1.5 w-1.5",
          size === "sm" && "h-2 w-2",
          size === "default" && "h-2.5 w-2.5",
          size === "lg" && "h-3 w-3",
          (size === "xl" || size === "2xl") && "h-3.5 w-3.5",
          status === "online" && "bg-green-500",
          status === "offline" && "bg-gray-400",
          status === "busy" && "bg-red-500",
          status === "away" && "bg-yellow-500"
        )} />
      )}
    </Component>
  )
})

ResponsiveAvatar.displayName = "ResponsiveAvatar"

// Enhanced responsive icon component
export const ResponsiveIcon = forwardRef(({
  icon: Icon,
  className,
  size = "default", // xs, sm, default, lg, xl, 2xl
  variant = "default", // default, filled, outlined
  color = "default", // default, primary, secondary, success, warning, error
  animate = false,
  ...props
}, ref) => {
  const getSizeClasses = () => {
    const sizes = {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
      "2xl": "h-10 w-10"
    }
    return sizes[size] || sizes.default
  }

  const getColorClasses = () => {
    const colors = {
      default: "text-foreground",
      primary: "text-cedo-blue",
      secondary: "text-cedo-gold",
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600"
    }
    return colors[color] || colors.default
  }

  const iconClasses = cn(
    getSizeClasses(),
    getColorClasses(),
    animate && "transition-all duration-200",
    className
  )

  const Component = animate ? motion.div : "div"

  if (!Icon) return null

  return (
    <Component
      ref={ref}
      {...(animate && {
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.95 }
      })}
      {...props}
    >
      <Icon className={iconClasses} />
    </Component>
  )
})

ResponsiveIcon.displayName = "ResponsiveIcon"

export default ResponsiveImage
