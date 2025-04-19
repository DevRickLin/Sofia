import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CounterStoreProvider } from "@/providers/counter-store-provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CounterStoreProvider>
      <Component {...pageProps} />
    </CounterStoreProvider>
  );
}
