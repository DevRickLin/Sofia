import { ThemeProvider } from "./context/ThemeContext";
import { A2AClientProvider } from "./context/A2AClientContext";
import { AutoFocusProvider } from "./context/AutoFocusContext";
import { A2AClient } from 'a2a-client';
import { useEffect, useState } from "react";
import Header from "./components/Header";
import { MindMap } from "./components/MindMap/index";

function App() {
    const [client, setClient] = useState<A2AClient | null>(null);

    useEffect(() => {
        // Initialize the A2AClient when the component mounts
        const a2aClient = new A2AClient({
            name: 'web-client',
            version: '1.0.0',
            skills: [],
            url: 'http://localhost:8000'
        });
        setClient(a2aClient);

        // Clean up when component unmounts
        return () => {
            // Add any necessary cleanup for the client
        };
    }, []);

    if (!client) {
        return <div>Loading...</div>;
    }

    return (
        <ThemeProvider>
            <A2AClientProvider client={client}>
                <AutoFocusProvider>
                    <div className="flex flex-col h-screen  ">
                        <header className="h-16 flex-shrink-0">
                            <Header />
                        </header>

                        <main className="flex-1 w-full mx-auto overflow-auto">
                            <MindMap />
                        </main>
                    </div>
                </AutoFocusProvider>
            </A2AClientProvider>
        </ThemeProvider>
    );
}

export default App;
