import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIMessage,
  AIPanelMode,
  CitationStyleSelection,
  Paper,
  PaperTemplate,
  ReasoningEffort,
  WritingMode,
} from "@/lib/types";
import {
  DEFAULT_CITATION_STYLE_SELECTION,
  normalizeCitationStyleSelection,
} from "@/lib/constants";
import { STORAGE_KEYS, STORAGE_VERSION } from "@/lib/storage";

const normalizePaperCitationStyle = (paper: Paper): Paper => ({
  ...paper,
  citationStyle: normalizeCitationStyleSelection(paper.citationStyle),
  references: paper.references ?? [],
});

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
  autocompleteEnabled: boolean;

  // Diffusion
  isDiffusing: boolean;
  diffusionStep: number;
  diffusionContent: string;
  diffusionEnabled: boolean;

  // Reasoning
  reasoningEffort: ReasoningEffort;

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
  setAutocompleteEnabled: (enabled: boolean) => void;
  setIsDiffusing: (diffusing: boolean) => void;
  setDiffusionStep: (step: number) => void;
  setDiffusionContent: (content: string) => void;
  setDiffusionEnabled: (enabled: boolean) => void;
  resetDiffusion: () => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  setWordCount: (count: number) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExporting: (exporting: boolean) => void;

  // Persistence-aware actions
  savePaper: (id: string, updates: Partial<Omit<Paper, "id">>) => void;
  deletePaper: (id: string) => void;
  updatePaperContent: (id: string, content: string, wordCount: number) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
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
      autocompleteEnabled: true,

      // Diffusion
      isDiffusing: false,
      diffusionStep: 0,
      diffusionContent: "",
      diffusionEnabled: false,

      // Reasoning
      reasoningEffort: "medium",

      // UI
      wordCount: 0,
      isSaving: false,
      isExporting: false,

      // Actions
      setCurrentPaper: (paper) =>
        set({ currentPaper: paper ? normalizePaperCitationStyle(paper) : null, isDirty: false }),
      setPapers: (papers) => set({ papers: papers.map(normalizePaperCitationStyle) }),
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
      setSelectedText: (selectedText, selectionRange) =>
        set({ selectedText, selectionRange: selectionRange ?? null }),
      setGhostText: (ghostText) => set({ ghostText }),
      setShowGhostText: (showGhostText) => set({ showGhostText }),
      setAutocompleteEnabled: (autocompleteEnabled) => set({ autocompleteEnabled }),
      setIsDiffusing: (isDiffusing) => set({ isDiffusing }),
      setDiffusionStep: (diffusionStep) => set({ diffusionStep }),
      setDiffusionContent: (diffusionContent) => set({ diffusionContent }),
      setDiffusionEnabled: (diffusionEnabled) => set({ diffusionEnabled }),
      resetDiffusion: () => set({ isDiffusing: false, diffusionStep: 0, diffusionContent: "" }),
      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
      setWordCount: (wordCount) => set({ wordCount }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setIsExporting: (isExporting) => set({ isExporting }),

      // Persistence-aware actions
      savePaper: (id, updates) =>
        set((s) => {
          const updatedAt = new Date().toISOString();
          const merged = { ...updates, updatedAt };
          return {
            papers: s.papers.map((p) =>
              p.id === id ? normalizePaperCitationStyle({ ...p, ...merged }) : p
            ),
            currentPaper:
              s.currentPaper?.id === id
                ? normalizePaperCitationStyle({ ...s.currentPaper, ...merged })
                : s.currentPaper,
          };
        }),

      deletePaper: (id) =>
        set((s) => ({
          papers: s.papers.filter((p) => p.id !== id),
          currentPaper: s.currentPaper?.id === id ? null : s.currentPaper,
        })),

      updatePaperContent: (id, content, wordCount) =>
        set((s) => {
          const updatedAt = new Date().toISOString();
          return {
            papers: s.papers.map((p) =>
              p.id === id ? { ...p, content, wordCount, updatedAt } : p
            ),
            currentPaper:
              s.currentPaper?.id === id
                ? { ...s.currentPaper, content, wordCount, updatedAt }
                : s.currentPaper,
            isDirty: false,
            isSaving: false,
          };
        }),
    }),
    {
      name: STORAGE_KEYS.editor,
      version: STORAGE_VERSION,
      skipHydration: true,
      partialize: (state) => ({
        papers: state.papers,
        autocompleteEnabled: state.autocompleteEnabled,
        diffusionEnabled: state.diffusionEnabled,
        reasoningEffort: state.reasoningEffort,
      }),
      migrate: (persisted) => persisted as Record<string, unknown>,
    }
  )
);

// ─── Dashboard Store ───────────────────────────────────────────

interface DashboardState {
  isCreating: boolean;
  selectedTemplate: PaperTemplate;
  selectedCitationStyle: CitationStyleSelection;
  searchQuery: string;
  setIsCreating: (creating: boolean) => void;
  setSelectedTemplate: (template: PaperTemplate) => void;
  setSelectedCitationStyle: (style: CitationStyleSelection) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      isCreating: false,
      selectedTemplate: "blank",
      selectedCitationStyle: { ...DEFAULT_CITATION_STYLE_SELECTION },
      searchQuery: "",
      setIsCreating: (isCreating) => set({ isCreating }),
      setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
      setSelectedCitationStyle: (selectedCitationStyle) =>
        set({ selectedCitationStyle: normalizeCitationStyleSelection(selectedCitationStyle) }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: STORAGE_KEYS.dashboard,
      version: STORAGE_VERSION,
      skipHydration: true,
      partialize: (state) => ({
        selectedTemplate: state.selectedTemplate,
        selectedCitationStyle: state.selectedCitationStyle,
      }),
      migrate: (persisted) => persisted as Record<string, unknown>,
    }
  )
);
