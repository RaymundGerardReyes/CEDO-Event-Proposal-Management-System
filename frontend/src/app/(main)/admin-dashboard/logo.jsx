const Logo = ({ className = "", width = 150, height = 45 }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <svg
                width={width}
                height={height}
                viewBox="0 0 200 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300 hover:filter hover:drop-shadow-md"
            >
                {/* Logo Primary Shape */}
                <path
                    d="M40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10Z"
                    fill="url(#paint0_linear)"
                    className="transition-all duration-300"
                />

                {/* Inner Elements */}
                <path
                    d="M40 20C29.0589 20 20 29.0589 20 40C20 50.9411 29.0589 60 40 60C50.9411 60 60 50.9411 60 40C60 29.0589 50.9411 20 40 20Z"
                    fill="white"
                    fillOpacity="0.2"
                />

                {/* Text Elements */}
                <path
                    d="M85 25H95L105 45H106L116 25H126V55H118V35H117L108 55H103L94 35H93V55H85V25Z"
                    fill="#333333"
                    className="transition-all duration-300"
                />
                <path
                    d="M130 25H155V32H139V36H153V43H139V48H155V55H130V25Z"
                    fill="#333333"
                    className="transition-all duration-300"
                />
                <path
                    d="M160 25H170L185 42H186V25H194V55H184L169 38H168V55H160V25Z"
                    fill="#333333"
                    className="transition-all duration-300"
                />

                {/* Decorative Elements */}
                <circle cx="40" cy="40" r="5" fill="#333333" />

                {/* Gradient Definitions */}
                <defs>
                    <linearGradient id="paint0_linear" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4F46E5" />
                        <stop offset="1" stopColor="#7C3AED" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}

export default Logo
