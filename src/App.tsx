import React, { useEffect } from "react";
import TypingTest from "./components/TypingTest";
// import VSLogo from "./assets/logo.jpg";
import appLogo from "./assets/TypeRush.png";

function App() {
  useEffect(() => {
    if (!localStorage.getItem("typingResults")) {
      localStorage.setItem("typingResults", JSON.stringify([]));
    }
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#0d1117] text-[#e1e7ef] flex flex-col font-sans selection:bg-blue-500/30">
      <header className="container mx-auto px-4 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <img src={appLogo} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              TypeRush
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 flex-grow flex flex-col items-center justify-center overflow-hidden py-2">
        <div className="w-full max-w-5xl bg-[#161b22] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <TypingTest />
        </div>
      </main>

      <footer className="shrink-0 border-t border-gray-800 bg-[#0d1117] py-4">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Designed and Developed by{" "}
              <a
                href="https://in.linkedin.com/in/vinay-sai-chelupuri-085642277"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                Vinay Sai Chelupuri
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
