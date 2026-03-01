import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Microsite from './pages/Microsite';
import EventDetail from './pages/EventDetail';
import Exchange from './pages/Exchange';
import MarginIntelligence from './pages/MarginIntelligence';

function App() {
  return (
    <BrowserRouter>
      <div className="relative w-full min-h-screen bg-page-bg text-page-text">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/agent/login" element={<Login />} />
          <Route path="/agent/dashboard" element={<Dashboard />} />
          <Route path="/agent/create" element={<Create />} />
          <Route path="/microsite/:id" element={<Microsite />} />
          <Route path="/agent/event/:id" element={<EventDetail />} />
          <Route path="/agent/exchange" element={<Exchange />} />
          <Route path="/agent/margin" element={<MarginIntelligence />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
