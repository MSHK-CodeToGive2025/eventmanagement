import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EventList from './components/EventList'
import EventDetail from './components/EventDetail'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/events" element={<EventList />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/" element={<EventList />} />
              </Routes>
            </div>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App 