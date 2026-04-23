import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IdeaDetail from './pages/IdeaDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
        <header className="bg-gray-800 shadow-md p-4 sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              AI Content Factory
            </Link>
          </div>
        </header>

        <main className="container mx-auto p-4 flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/idea/:id" element={<IdeaDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
