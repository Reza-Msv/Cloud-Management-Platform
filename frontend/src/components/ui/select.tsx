import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, error, ...props }, ref) => {
    return (
      <div className={cn("relative inline-flex items-center", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "h-8 w-full appearance-none rounded-md border border-input bg-background ps-3.5 pe-10 text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute end-3 flex items-center justify-center text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
    );
  }
);

Select.displayName = "Select";
