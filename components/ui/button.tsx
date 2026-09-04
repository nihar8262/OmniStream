import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#d4af37] to-[#e8a33d] text-neutral-950 font-semibold shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/40 hover:brightness-110",
        gold:
          "bg-[#d4af37] text-neutral-950 font-semibold hover:bg-[#e5bf43] shadow-md shadow-[#d4af37]/20",
        secondary:
          "bg-white/10 text-white hover:bg-white/15 border border-white/10 backdrop-blur-md",
        outline:
          "border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37]",
        ghost:
          "text-neutral-300 hover:text-white hover:bg-white/5",
        destructive:
          "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
        glass:
          "bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:border-[#d4af37]/50 hover:bg-white/10 shadow-lg shadow-black/40",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base font-semibold",
        icon: "h-10 w-10",
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
