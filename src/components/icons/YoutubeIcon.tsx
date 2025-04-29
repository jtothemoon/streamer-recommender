import Image from "next/image";

export default function YoutubeIcon({ width = 20, height = 20, className = "" }) {
  return (
    <Image
      src="/assets/icons/yt_icon_rgb.png"
      width={width}
      height={height}
      alt="YouTube Icon"
      className={className}
      priority
    />
  );
}
