// src/stores/counter-store.ts
import { createStore, type StoreApi } from 'zustand/vanilla'
import type { StateCreator } from 'zustand'

export type CounterState = {
  count: number
}

export type CounterActions = {
  decrementCount: () => void
  incrementCount: () => void
}

export type CounterStore = CounterState & CounterActions

export const initCounterStore = (): CounterState => {
  // Initialize with a dynamic value, e.g., current year, or fetch initial state
  // return { count: new Date().getFullYear() }
  return { count: 0 } // Using a simple default for now
}

export const defaultInitState: CounterState = {
  count: 0,
}

export const createCounterStore = (
  initState: CounterState = defaultInitState,
) => {
  return createStore<CounterStore>(((set: StoreApi<CounterStore>['setState']) => ({
    ...initState,
    decrementCount: () => set((state: CounterState) => ({ count: state.count - 1 })),
    incrementCount: () => set((state: CounterState) => ({ count: state.count + 1 })),
  })) as StateCreator<CounterStore>)
} 