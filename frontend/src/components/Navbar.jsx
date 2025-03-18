import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white">
      {/* Main navigation */}
      <nav className="container mx-auto px-4 bg-white shadow-md">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="https://zubinfoundation.org/wp-content/uploads/2022/07/TZF-logo-svg-img.svg"
                alt="The Zubin Foundation Logo"
                className="h-12 w-auto"
              />
              <span className="text-2xl font-heading font-bold text-zubin-text hover:text-zubin-accent transition-colors">
                The Zubin Foundation
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/events"
                className="text-zubin-text hover:text-zubin-accent px-3 py-2 text-sm font-medium transition-colors"
              >
                Events
              </Link>
              {user && (user.role === 'admin' || user.role === 'volunteer') && (
                <>
                  <Link
                    to="/events/create"
                    className="text-zubin-text hover:text-zubin-accent px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Create Event
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-zubin-text hover:text-zubin-accent px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-zubin-gray text-sm">Welcome, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-zubin-accent text-zubin-text px-6 py-2 rounded-full text-sm font-medium hover:bg-zubin-primary transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-zubin-text hover:text-zubin-accent px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-zubin-primary text-zubin-text px-6 py-2 rounded-full text-sm font-medium hover:bg-zubin-accent transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu - can be expanded if needed */}
      <div className="md:hidden">
        {/* Add mobile menu implementation here if needed */}
      </div>
    </div>
  );
};

export default Navbar; 