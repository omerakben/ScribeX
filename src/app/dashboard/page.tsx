"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/dashboard/top-bar";
import { PapersList } from "@/components/dashboard/papers-list";
import { NewPaperDialog } from "@/components/dashboard/new-paper-dialog";

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <TopBar />

      <div className="flex flex-1 flex-col overflow-auto">
        {/* Page header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div>
            <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-100">
              Papers
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Manage and organize your academic papers
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Paper
          </Button>
        </div>

        {/* Papers grid */}
        <div className="flex flex-1 px-8 pb-8">
          <PapersList onNewPaper={() => setDialogOpen(true)} />
        </div>
      </div>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
