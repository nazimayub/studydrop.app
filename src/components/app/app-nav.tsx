"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Home, NotebookText, MessageSquare, Award, Activity } from "lucide-react"

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/activity", icon: Activity, label: "Activity" },
    { href: "/notes", icon: NotebookText, label: "Notes" },
    { href: "/forum", icon: MessageSquare, label: "Q&A Forum" },
    { href: "/rewards", icon: Award, label: "Rewards" },
]

export function AppNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()

  if (isMobile) {
    return (
      <>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                "flex items-center gap-4 px-2.5",
                pathname.startsWith(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </>
    )
  }

  return (
    <>
      {navItems.map((item) => (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                  pathname.startsWith(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  )
}
