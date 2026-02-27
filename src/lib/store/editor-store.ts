import { create } from "zustand";
import type { AIMessage, AIPanelMode, Paper, PaperTemplate, CitationStyle, WritingMode } from "@/lib/types";

// ─── Editor Store ──────────────────────────────────────────────

interface EditorState {
  // Document
  currentPaper: Paper | null;
  papers: Paper[];
  isDirty: boolean;

  // AI Panel
  aiPanelOpen: boolean;
  aiPanelMode: AIPanelMode;
  aiMessages: AIMessage[];
  isAIStreaming: boolean;

  // Writing mode
  activeWritingMode: WritingMode | null;
  selectedText: string;
  selectionRange: { from: number; to: number } | null;

  // Autocomplete
  ghostText: string;
  showGhostText: boolean;

  // Diffusion
  isDiffusing: boolean;
  diffusionStep: number;

  // UI
  wordCount: number;
  isSaving: boolean;
  isExporting: boolean;

  // Actions
  setCurrentPaper: (paper: Paper | null) => void;
  setPapers: (papers: Paper[]) => void;
  setIsDirty: (dirty: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelMode: (mode: AIPanelMode) => void;
  addAIMessage: (message: AIMessage) => void;
  updateLastAIMessage: (content: string) => void;
  clearAIMessages: () => void;
  setIsAIStreaming: (streaming: boolean) => void;
  setActiveWritingMode: (mode: WritingMode | null) => void;
  setSelectedText: (text: string, range?: { from: number; to: number }) => void;
  setGhostText: (text: string) => void;
  setShowGhostText: (show: boolean) => void;
  setIsDiffusing: (diffusing: boolean) => void;
  setDiffusionStep: (step: number) => void;
  setWordCount: (count: number) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Document
  currentPaper: null,
  papers: [],
  isDirty: false,

  // AI Panel
  aiPanelOpen: true,
  aiPanelMode: "chat",
  aiMessages: [],
  isAIStreaming: false,

  // Writing mode
  activeWritingMode: null,
  selectedText: "",
  selectionRange: null,

  // Autocomplete
  ghostText: "",
  showGhostText: false,

  // Diffusion
  isDiffusing: false,
  diffusionStep: 0,

  // UI
  wordCount: 0,
  isSaving: false,
  isExporting: false,

  // Actions
  setCurrentPaper: (paper) => set({ currentPaper: paper, isDirty: false }),
  setPapers: (papers) => set({ papers }),
  setIsDirty: (isDirty) => set({ isDirty }),
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAIPanelMode: (aiPanelMode) => set({ aiPanelMode }),
  addAIMessage: (message) => set((s) => ({ aiMessages: [...s.aiMessages, message] })),
  updateLastAIMessage: (content) =>
    set((s) => {
      const msgs = [...s.aiMessages];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      }
      return { aiMessages: msgs };
    }),
  clearAIMessages: () => set({ aiMessages: [] }),
  setIsAIStreaming: (isAIStreaming) => set({ isAIStreaming }),
  setActiveWritingMode: (activeWritingMode) => set({ activeWritingMode }),
  setSelectedText: (selectedText, selectionRange) => set({ selectedText, selectionRange: selectionRange ?? null }),
  setGhostText: (ghostText) => set({ ghostText }),
  setShowGhostText: (showGhostText) => set({ showGhostText }),
  setIsDiffusing: (isDiffusing) => set({ isDiffusing }),
  setDiffusionStep: (diffusionStep) => set({ diffusionStep }),
  setWordCount: (wordCount) => set({ wordCount }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsExporting: (isExporting) => set({ isExporting }),
}));

// ─── Dashboard Store ───────────────────────────────────────────

interface DashboardState {
  isCreating: boolean;
  selectedTemplate: PaperTemplate;
  selectedCitationStyle: CitationStyle;
  searchQuery: string;
  setIsCreating: (creating: boolean) => void;
  setSelectedTemplate: (template: PaperTemplate) => void;
  setSelectedCitationStyle: (style: CitationStyle) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isCreating: false,
  selectedTemplate: "blank",
  selectedCitationStyle: "apa7",
  searchQuery: "",
  setIsCreating: (isCreating) => set({ isCreating }),
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  setSelectedCitationStyle: (selectedCitationStyle) => set({ selectedCitationStyle }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
