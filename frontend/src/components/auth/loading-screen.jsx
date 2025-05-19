import { LogoSimple } from "@/components/logo"
import { Loader2 } from "lucide-react"

export function AuthLoadingScreen({ message = "Initializing Authentication..." }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="w-full max-w-md px-4 py-8 flex flex-col items-center">
                {/* Logo */}
                <div className="mb-8 animate-fade-in">
                    <LogoSimple size="large" />
                </div>

                {/* Card with spinner */}
                <div className="bg-white w-full rounded-lg shadow-lg p-8 flex flex-col items-center">
                    {/* Spinner with pulsing ring */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-t-cedo-blue border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-cedo-blue/30 border-b-transparent border-l-cedo-blue/30 animate-pulse"></div>
                        <Loader2 className="h-16 w-16 animate-spin text-cedo-blue relative z-10" />
                    </div>

                    {/* Message */}
                    <h3 className="text-lg font-medium text-gray-800 mb-2 text-center">{message}</h3>
                    <p className="text-sm text-gray-500 text-center">Please wait while we prepare your secure session</p>

                    {/* Progress bar */}
                    <div className="w-full mt-6 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cedo-blue h-1.5 rounded-full animate-progress"></div>
                    </div>
                </div>

                {/* Security message */}
                <div className="mt-6 flex items-center text-xs text-gray-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5 text-cedo-blue"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                    Secure authentication in progress
                </div>
            </div>
        </div>
    )
}
