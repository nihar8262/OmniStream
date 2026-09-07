import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#e7b92f]/30 bg-[#e7b92f]/10 text-[#e7b92f]",
        secondary:
          "border-white/[0.08] bg-white/[0.04] text-[#a5a39c]",
        gold:
          "border-transparent bg-[#e7b92f] text-[#080808] font-semibold",
        destructive:
          "border-red-500/25 bg-red-500/10 text-red-300",
        outline:
          "border-white/[0.12] text-[#f5f3ed]",
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
