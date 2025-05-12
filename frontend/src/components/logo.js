export function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <div className="text-3xl font-bold text-cedo-gold">CED</div>
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-cedo-gold flex items-center justify-center">
          <span className="font-bold text-cedo-blue text-xs">O</span>
        </div>
      </div>
      <div className="text-xs text-cedo-blue mt-1">
        <span className="opacity-70">City</span> <span className="text-cedo-gold">Economic Development Office</span>
      </div>
    </div>
  )
}

export function LogoSimple() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1">
        <div className="text-3xl font-bold text-cedo-gold">CED</div>
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-cedo-gold flex items-center justify-center">
          <span className="font-bold text-cedo-blue text-xs">O</span>
        </div>
      </div>
    </div>
  )
}
