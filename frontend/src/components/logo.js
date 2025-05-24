import Image from "next/image";

export const LogoSimple = () => {
  return (
    <Image
      src="/CEDO.svg"
      alt="CEDO Logo"
      width={120}
      height={120}
      priority
    />
  );
};