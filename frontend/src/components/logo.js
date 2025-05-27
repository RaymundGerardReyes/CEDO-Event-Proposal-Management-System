import Image from "next/image";

export const LogoSimple = () => {
  return (
    <Image
      src="/CEDO2.svg"
      alt="CEDO Logo"
      width={270}  // Adjusted width
      height={100} // Adjusted height
      priority
      className="w-40 sm:w-60 md:w-70
       h-auto" // Adjusted CSS classes
    />
  );
};