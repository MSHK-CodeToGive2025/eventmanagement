import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventAdminForm from './components/events/EventAdminForm';
import LandingPage from './pages/public/landing-page';
import { Navigation } from './components/layout/navigation';
import SignIn from './pages/public/sign-in';
import UserManagementPage from './pages/internal/user-management/users-management-page';
import { UserManagementProvider } from './contexts/user-management-context';
import FormsPage from './pages/internal/forms-builder/forms-builder';
import NewFormPage from './components/forms-builder/new-form-page';
import EventsBuilderPage from './pages/internal/events-builder/events-builder-page';
import EnhancedEventsPage from './pages/public/enhanced-events/enhanced-events-page';
import EnhancedEventDetailPage from './pages/public/enhanced-events/enhanced-event-detail-page';
import { AnalyticsDashboard } from './pages/internal/analytics/analytics-dashboard';
import SignUp from './pages/public/sign-up';
import EventRemindersPage from './pages/internal/events-builder/event-reminders-page';

const App: React.FC = () => {

  return (
    <Router>
      <AuthProvider>
        <UserManagementProvider>
        <div className="min-h-screen bg-gray-100">
          <div className="flex flex-col min-h-screen bg-white">
            <Navigation />
            <Routes>
              <Route path="/login" element={<SignIn />} />
              <Route path="/register" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/enhanced-events" element={<EnhancedEventsPage />} />
              <Route path="/enhanced-events/:id" element={<EnhancedEventDetailPage />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:id/edit" element={<EventAdminForm />} />
              <Route path="/manage/events-builder" element={<EventsBuilderPage />} />
              <Route path="/manage/events/:id/reminders" element={<EventRemindersPage />} />
              <Route path="/manage/forms" element={<FormsPage />} />
              <Route path="/manage/forms/new" element={<NewFormPage />} />
              <Route path="/manage/users" element={<UserManagementPage />} />
              <Route path="/manage/analytics" element={<AnalyticsDashboard />} />
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </div>
        </div>
        </UserManagementProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
