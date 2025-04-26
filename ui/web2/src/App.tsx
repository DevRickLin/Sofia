import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import { MindMap } from "./components/MindMap/index";

function App() {
    return (
        <ThemeProvider>
            <div className="flex flex-col h-screen dark:bg-[#242424]">
                <header className="h-16 flex-shrink-0">
                    <Header />
                </header>

                <main className="flex-1 w-full mx-auto overflow-auto">
                    <MindMap />
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;
