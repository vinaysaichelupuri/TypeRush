import React from 'react';
import TypingTest from './components/TypingTest';

function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <TypingTest />
      </div>
      
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Powered by{' '}
              <span className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                Vinay Sai Chelupuri
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;