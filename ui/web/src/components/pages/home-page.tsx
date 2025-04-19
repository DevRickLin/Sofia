import { useCounterStore } from '@/providers/counter-store-provider'

export const HomePage = () => {
  const { count, incrementCount, decrementCount } = useCounterStore(
    (state) => state,
  )

  return (
    <div>
      <h1>Zustand Counter Example (Pages Router)</h1>
      <p>Count: {count}</p>
      <hr />
      <button type="button" onClick={incrementCount} style={{ marginRight: '8px' }}>
        Increment Count
      </button>
      <button type="button" onClick={decrementCount}>
        Decrement Count
      </button>
    </div>
  )
} 