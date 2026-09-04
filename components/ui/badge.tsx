import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] shadow-sm",
        secondary:
          "border-white/10 bg-white/5 text-neutral-300",
        gold:
          "border-transparent bg-gradient-to-r from-[#d4af37] to-[#e8a33d] text-neutral-950 font-bold",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-400",
        outline:
          "border-white/20 text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
