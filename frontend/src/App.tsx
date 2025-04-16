import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/header';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import UserManagement from './pages/UserManagement';
import Events from './pages/Events';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/" element={<Home />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
