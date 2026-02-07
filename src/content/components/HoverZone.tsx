interface HoverZoneProps {
  hidden: boolean;
}

export function HoverZone({ hidden }: HoverZoneProps) {
  if (hidden) return null;
  return <div className="chatlog-hover-zone chatlog-hover-right" />;
}
