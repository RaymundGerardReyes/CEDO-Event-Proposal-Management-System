import Image from "next/image";

export const LogoSimple = () => {
  return (
    <Image
      src="/CEDO LOGO.svg"
      alt="CEDO Logo"
      width={290}  // Adjusted width
      height={120} // Adjusted height
      priority
      className="w-40 sm:w-60 md:w-70
       h-auto" // Adjusted CSS classes
    />
  );
};