import { useProjectPresence } from "@/hooks/useProjectPresence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = [
  "#2ebbcc", // brand cyan
  "#7c3aed", // violet
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#0891b2", // sky
  "#c026d3", // fuchsia
];

function getColor(id: number): string {
  return COLORS[id % COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PresenceAvatarsProps {
  projectId: number;
}

export function PresenceAvatars({ projectId }: PresenceAvatarsProps) {
  const { members } = useProjectPresence(projectId);

  if (members.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center">
        {members.map((member, i) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-background cursor-default select-none shrink-0"
                style={{
                  backgroundColor: getColor(member.id),
                  marginLeft: i > 0 ? "-6px" : 0,
                  zIndex: members.length - i,
                  position: "relative",
                }}
              >
                {getInitials(member.name)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {member.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
