import Image from "next/image";

export default function ChzzkIcon({ width = 20, height = 20, className = "" }) {
  return (
    <Image
      src="/assets/icons/chzzk Icon_03.png"
      width={width}
      height={height}
      alt="Chzzk Icon"
      className={className}
      priority
    />
  );
}
