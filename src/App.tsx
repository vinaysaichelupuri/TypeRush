import React, { useEffect } from "react";
import TypingTest from "./components/TypingTest";
import VSLogo from "./assets/logo.jpg";

function App() {
  useEffect(() => {
    localStorage.setItem("typingResults", JSON.stringify([]));
  });
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
          <img src={VSLogo} alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            TypeRush
          </h1>
          <p className="text-gray-400 text-sm">Simple and fast typing test</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 flex-grow">
        <TypingTest />
      </div>

      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
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
