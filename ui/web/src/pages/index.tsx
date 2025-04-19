import Head from "next/head";
import { HomePage } from "@/components/pages/home-page";

export default function Home() {
  return (
    <>
      <Head>
        <title>Zustand Example</title>
        <meta name="description" content="Zustand Integration Example" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <HomePage />
      </main>
    </>
  );
}
