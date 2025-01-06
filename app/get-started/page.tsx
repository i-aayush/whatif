import React from 'react';

export default function GetStarted() {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 text-white h-screen p-4">
        <nav className="space-y-4">
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Select model</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Select LoRa (beta)</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Set preferences</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Take a photo</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Remix a photo</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Make a video</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">Try on clothes</a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">News + coming soon</a>
        </nav>
      </aside>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to Photo AI</h1>
          <p className="text-lg text-gray-600">Boost your Photo AI experience</p>
        </header>
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example feature cards */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Generate Photos</h2>
            <p className="text-gray-700">Create stunning images with AI.</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Upgrade Options</h2>
            <p className="text-gray-700">Explore premium features.</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Community</h2>
            <p className="text-gray-700">Join our vibrant community.</p>
          </div>
        </main>
        <footer className="text-center mt-8">
          <p className="text-sm text-gray-500">© 2023 Photo AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
} 