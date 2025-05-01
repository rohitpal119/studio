import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  // Base styles: relative positioning, width, rounded corners, border, padding
  // Icon positioning: use flexbox for better alignment
  "relative w-full rounded-lg border p-4 flex items-start space-x-3",
  // [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", // Replaced with flex alignment
  {
    variants: {
      variant: {
        // Subtle background for default alert
        default: "bg-background border-border text-foreground [&>svg]:text-foreground",
        destructive:
          // Use destructive colors, slightly transparent border
          "bg-destructive/10 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
// Add children prop explicitly for clarity
>(({ className, variant, children, ...props }, ref) => {
    // Find the icon if provided as a direct child
    const icon = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.props.className?.includes('h-4 w-4') // Heuristic to find icon
    );
    // Filter out the icon from the main content children
    const contentChildren = React.Children.toArray(children).filter(
      child => child !== icon
    );

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
         {/* Render icon first if found */}
        {icon && <div className="shrink-0">{icon}</div>}
         {/* Container for title and description */}
        <div className="flex-1">
           {contentChildren}
        </div>
      </div>
    );
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
// Use <h5> for semantic correctness
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Relaxed line height for better readability
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
