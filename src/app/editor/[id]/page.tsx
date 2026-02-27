"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/store/editor-store";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { AIPanel } from "@/components/editor/ai-panel";
import { WritingModeBar } from "@/components/editor/writing-mode-bar";
import { JoinGate } from "@/components/shared/join-gate";
import type { Editor } from "@tiptap/react";

export default function EditorPage() {
  const params = useParams();
  const paperId = params.id as string;

  const currentPaper = useEditorStore((s) => s.currentPaper);
  const papers = useEditorStore((s) => s.papers);
  const setCurrentPaper = useEditorStore((s) => s.setCurrentPaper);

  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const paper = papers.find((entry) => entry.id === paperId);

    if (paper) {
      setCurrentPaper(paper);
      return;
    }

    if (!currentPaper) {
      setCurrentPaper({
        id: paperId,
        title: "Untitled Paper",
        template: "blank",
        status: "draft",
        citationStyle: "apa7",
        content: "",
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [paperId, papers, currentPaper, setCurrentPaper]);

  const handleEditorReady = useCallback((instance: Editor) => {
    setEditor(instance);
  }, []);

  return (
    <JoinGate>
      <div className="relative flex h-screen flex-col overflow-hidden bg-surface">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_2%_0%,rgba(78,115,244,0.1),transparent_40%),radial-gradient(circle_at_98%_10%,rgba(34,190,154,0.1),transparent_38%)]" />

        <EditorToolbar editor={editor} />
        <WritingModeBar />

        <div className="flex min-h-0 flex-1">
          <EditorCanvas onEditorReady={handleEditorReady} />
          <AIPanel editor={editor} />
        </div>
      </div>
    </JoinGate>
  );
}
