import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7b92f]/50 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#e7b92f] to-[#d89f20] text-[#080808] font-semibold shadow-md shadow-[#e7b92f]/15 hover:shadow-[#e7b92f]/25 hover:brightness-105",
        gold:
          "bg-[#e7b92f] text-[#080808] font-semibold hover:bg-[#f0c94b] shadow-sm shadow-[#e7b92f]/15",
        secondary:
          "bg-white/[0.06] text-[#f5f3ed] hover:bg-white/[0.1] border border-white/[0.08] backdrop-blur-md",
        outline:
          "border border-white/[0.12] text-[#f5f3ed] hover:bg-white/[0.06] hover:border-white/[0.2]",
        ghost:
          "text-[#a5a39c] hover:text-[#f5f3ed] hover:bg-white/[0.05]",
        destructive:
          "bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25",
        glass:
          "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-[#f5f3ed] hover:border-white/[0.18] hover:bg-white/[0.08] shadow-lg shadow-black/30",
      },
      size: {
        default: "h-10 px-4 py-2 text-xs sm:text-sm",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
