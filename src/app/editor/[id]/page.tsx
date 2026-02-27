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
  const setCurrentPaper = useEditorStore((s) => s.setCurrentPaper);
  const papers = useEditorStore((s) => s.papers);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Load paper from store by ID
  useEffect(() => {
    const paper = papers.find((p) => p.id === paperId);
    if (paper) {
      setCurrentPaper(paper);
    } else if (!currentPaper) {
      // Create a default paper for development/empty state
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

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  return (
    <JoinGate>
      <div className="flex flex-col h-screen bg-surface">
        <EditorToolbar editor={editor} />
        <WritingModeBar />

        <div className="flex flex-1 min-h-0">
          <EditorCanvas onEditorReady={handleEditorReady} />
          <AIPanel editor={editor} />
        </div>
      </div>
    </JoinGate>
  );
}
