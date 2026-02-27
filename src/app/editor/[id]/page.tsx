"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/store/editor-store";
import { useHydration } from "@/hooks/use-hydration";
import { DEFAULT_CITATION_STYLE_SELECTION, AUTOSAVE_INTERVAL_MS } from "@/lib/constants";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { AIPanel } from "@/components/editor/ai-panel";
import { WritingModeBar } from "@/components/editor/writing-mode-bar";
import { JoinGate } from "@/components/shared/join-gate";
import type { Paper } from "@/lib/types";
import type { Editor } from "@tiptap/react";

export default function EditorPage() {
  const params = useParams();
  const paperId = params.id as string;
  const isHydrated = useHydration();

  const setCurrentPaper = useEditorStore((s) => s.setCurrentPaper);
  const setPapers = useEditorStore((s) => s.setPapers);
  const setIsSaving = useEditorStore((s) => s.setIsSaving);
  const updatePaperContent = useEditorStore((s) => s.updatePaperContent);

  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const loadedPaperIdRef = useRef<string | null>(null);

  // Keep a ref in sync so interval/beforeunload callbacks always have the latest editor
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Load paper from persisted store once hydration completes (runs once per paperId)
  useEffect(() => {
    if (!isHydrated) return;
    if (loadedPaperIdRef.current === paperId) return;

    const state = useEditorStore.getState();
    const paper = state.papers.find((entry) => entry.id === paperId);

    if (paper) {
      setCurrentPaper(paper);
    } else {
      // Paper not found — create a placeholder AND add it to the papers array
      const newPaper: Paper = {
        id: paperId,
        title: "Untitled Paper",
        template: "blank",
        status: "draft",
        citationStyle: DEFAULT_CITATION_STYLE_SELECTION,
        references: [],
        content: "",
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentPaper(newPaper);
      setPapers([...state.papers, newPaper]);
    }

    loadedPaperIdRef.current = paperId;
  }, [isHydrated, paperId, setCurrentPaper, setPapers]);

  // Save function — captures editor HTML and persists to store (→ localStorage)
  const saveNow = useCallback(() => {
    const ed = editorRef.current;
    if (!ed || !paperId) return;

    const state = useEditorStore.getState();
    if (!state.isDirty) return;

    setIsSaving(true);
    const html = ed.getHTML();
    const words = ed.storage.characterCount.words();
    updatePaperContent(paperId, html, words);
    // isDirty + isSaving are reset inside updatePaperContent
  }, [paperId, setIsSaving, updatePaperContent]);

  // Autosave interval (30s)
  useEffect(() => {
    const timer = setInterval(() => {
      const state = useEditorStore.getState();
      if (state.isDirty) {
        saveNow();
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [saveNow]);

  // Flush dirty content — shared by beforeunload, visibilitychange, and unmount
  const flushDirtyContent = useCallback(() => {
    const ed = editorRef.current;
    if (!ed || !paperId) return;

    const state = useEditorStore.getState();
    if (!state.isDirty) return;

    const html = ed.getHTML();
    const words = ed.storage.characterCount.words();
    updatePaperContent(paperId, html, words);
  }, [paperId, updatePaperContent]);

  // Save on beforeunload (tab close / refresh) + visibilitychange (mobile/tab switch)
  useEffect(() => {
    const handleBeforeUnload = () => flushDirtyContent();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushDirtyContent();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushDirtyContent]);

  // Save on unmount (SPA navigation away from editor)
  useEffect(() => {
    return () => flushDirtyContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  // Cmd/Ctrl+S manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNow]);

  const handleEditorReady = useCallback((instance: Editor) => {
    setEditor(instance);
  }, []);

  // Show nothing until localStorage has been rehydrated
  if (!isHydrated) {
    return (
      <JoinGate>
        <div className="flex h-screen items-center justify-center bg-ink-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      </JoinGate>
    );
  }

  return (
    <JoinGate>
      <div className="flex h-screen flex-col overflow-hidden bg-ink-50">
        <EditorToolbar editor={editor} onSave={saveNow} />
        <WritingModeBar />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <EditorCanvas onEditorReady={handleEditorReady} />
          <AIPanel editor={editor} />
        </div>
      </div>
    </JoinGate>
  );
}
