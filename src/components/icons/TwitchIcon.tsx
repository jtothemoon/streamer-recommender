import Image from "next/image";

export default function TwitchIcon({ width = 20, height = 20, className = "" }) {
  return (
    <Image
      src="/assets/icons/glitch_flat_purple.png"
      width={width}
      height={height}
      alt="Twitch Icon"
      className={className}
      priority
    />
  );
}
