import { create } from 'zustand'

type InspectorState = {
  selectedRule: string | null

  setSelectedRule: (ruleId: string | null) => void
}

export const useInspectorStore = create<InspectorState>((set) => ({
  selectedRule: null,

  setSelectedRule: (ruleId) => {
    set({ selectedRule: ruleId })
  },
}))
