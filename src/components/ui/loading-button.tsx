
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { ButtonProps } from "@/components/ui/button"

const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    loading?: boolean
  }
>(({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Comp>
  )
})
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
