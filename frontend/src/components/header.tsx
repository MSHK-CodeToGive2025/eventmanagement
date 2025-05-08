import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import {
  ChevronDown,
  Globe,
  Search,
  Bell,
  Menu,
  User,
  CalendarCheck,
  Settings,
  LogOut,
} from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full bg-white/90 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
      {/* Logo and Foundation Name */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <div className="relative group mr-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFE94E] to-[#00A7E1] rounded-full opacity-70 blur-sm group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-white p-1.5 rounded-full overflow-hidden shadow-sm">
              <img
                src="/zubin-logo1.png"
                alt="The Zubin Foundation"
                width={50}
                height={50}
                className="h-auto rounded-full"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              The Zubin Foundation
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Empowering Hong Kong's Ethnic Minorities
            </p>
          </div>
        </Link>
      </div>

      {/* Enhanced Navigation Links with modern styling */}
      <nav className="hidden lg:flex items-center gap-8">

        <a
            href="/events"
            className="text-gray-700 hover:text-[#00A7E1] transition-colors py-2 font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[#00A7E1] after:transition-all after:duration-300"
        >
            Events
        </a>

        <div className="group relative">
          <Link
            to="/events"
            className="text-gray-700 hover:text-[#00A7E1] transition-colors flex items-center gap-1 py-2 font-medium"
          >
            Manage
            <ChevronDown className="h-4 w-4 opacity-70 group-hover:rotate-180 transition-transform duration-300" />
          </Link>

          <div className="absolute top-full left-0 mt-1 w-56 bg-white shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-100 transform origin-top scale-95 group-hover:scale-100">
            <div className="py-2">
              <Link
                to="/events/create"
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
              >
                Create Event
              </Link>
              <Link
                to="/dashboard"
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
              >
                Dashboard
              </Link>

              <Link
                to="/user-management"
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
              >
                User Management
              </Link>

            </div>
          </div>
        </div>

 

      </nav>

      <div className="hidden md:flex items-center gap-5">
        <div className="group relative">
          <button className="flex items-center gap-1.5 text-gray-700 hover:text-[#00A7E1] transition-colors">
            <Globe className="h-5 w-5" />
            <span className="text-sm font-medium">English</span>
            <ChevronDown className="h-4 w-4 opacity-70 group-hover:rotate-180 transition-transform duration-300" />
          </button>

          <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-100 transform origin-top scale-95 group-hover:scale-100 z-50">
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 text-sm text-[#00A7E1] hover:bg-gray-50 font-medium flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00A7E1] flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </span>
                English
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-transparent"></span>
                中文 (即將推出)
              </button>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Search className="h-5 w-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        {user ? (
          <div className="group relative">
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:shadow-sm transition-all duration-300">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#00A7E1] to-[#0088c7] flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
            </button>

            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-100 transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-[#00A7E1] to-[#0088c7] flex items-center justify-center text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-500">john.doe@example.com</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Link>
                <Link
                  to="/my-events"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
                >
                  <CalendarCheck className="h-4 w-4" />
                  My Events
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>
              </div>

              <div className="py-2 border-t border-gray-100">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="text-gray-700 font-medium px-5 py-2.5 rounded-full hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-[#FFE94E] to-[#FFD700] text-gray-900 font-medium px-5 py-2.5 rounded-full hover:shadow-md transition-all duration-300 shadow-sm transform hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu button and language selector */}
      <div className="md:hidden flex items-center gap-3">
        <div className="group relative">
          <button className="flex items-center text-gray-700 hover:text-[#00A7E1] transition-colors">
            <Globe className="h-5 w-5" />
          </button>
          <div className="absolute top-full right-0 mt-1 w-48 bg-white shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-100 transform origin-top scale-95 group-hover:scale-100 z-50">
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 text-sm text-[#00A7E1] hover:bg-gray-50 font-medium flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#00A7E1] flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </span>
                English
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A7E1] transition-colors flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-transparent"></span>
                中文 (即將推出)
              </button>
            </div>
          </div>
        </div>

        {user && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#00A7E1] to-[#0088c7] flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
        )}

        <button className="text-gray-700 hover:text-[#00A7E1] transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
