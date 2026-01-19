// src/components/gc/PlanBadge.tsx
import "./PlanBadge.css";

interface PlanBadgeProps {
  isPremium: boolean;
  size?: "small" | "medium" | "large";
}

export function PlanBadge({ isPremium, size = "medium" }: PlanBadgeProps) {
  return (
    <span className={`gc-plan-badge ${isPremium ? "premium" : "free"} ${size}`}>
      {isPremium ? "⭐ Premium" : "Free"}
    </span>
  );
}






