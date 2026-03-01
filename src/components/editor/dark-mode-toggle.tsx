"use client";

import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils/cn";

export function DarkModeToggle() {
  const darkMode = useEditorStore((s) => s.darkMode);
  const toggleDarkMode = useEditorStore((s) => s.toggleDarkMode);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
              darkMode
                ? "bg-brand-900 text-brand-300"
                : "text-ink-400 hover:text-ink-600 hover:bg-ink-50"
            )}
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {darkMode ? "Switch to light mode" : "Switch to dark mode"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
