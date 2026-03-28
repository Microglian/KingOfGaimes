import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import CardEditorPage from "@/pages/CardEditorPage";
import CollectionPage from "@/pages/CollectionPage";

function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <nav className="app-nav" data-testid="main-nav">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-black tracking-tighter" style={{ color: '#00E5FF', fontFamily: 'Outfit, sans-serif' }}>
                CARD FORGE
              </h1>
              <div className="flex items-center gap-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-link px-3 py-1.5 rounded-md ${isActive ? 'active' : ''}`}
                  data-testid="nav-editor"
                >
                  Editor
                </NavLink>
                <NavLink
                  to="/collection"
                  className={({ isActive }) => `nav-link px-3 py-1.5 rounded-md ${isActive ? 'active' : ''}`}
                  data-testid="nav-collection"
                >
                  Collection
                </NavLink>
              </div>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<CardEditorPage />} />
          <Route path="/collection" element={<CollectionPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
