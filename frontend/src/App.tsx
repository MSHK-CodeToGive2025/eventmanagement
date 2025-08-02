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
import FormDetailPage from './pages/internal/forms-builder/form-detail-page';
import FormEditPage from './pages/internal/forms-builder/form-edit-page';
import EventsBuilderPage from './pages/internal/events-builder/events-builder-page';
import EnhancedEventsPage from './pages/public/enhanced-events/enhanced-events-page';
import EnhancedEventDetailPage from './pages/public/enhanced-events/enhanced-event-detail-page';
import EnhancedRichTextTest from './pages/internal/forms-builder/enhanced-rich-text-test';

import SignUp from './pages/public/sign-up';
import EventRemindersPage from './pages/internal/events-builder/event-reminders-page';
import ManageRegistrations from './pages/internal/events-builder/manage-registrations';
import EventsPage from './pages/public/events/events-page-simple';
import UserProfile from './pages/public/user-profile';
import MyRegistrations from './pages/public/my-registrations';

const App: React.FC = () => {

  return (
    <Router>
      <AuthProvider>
        <UserManagementProvider>
        <div className="min-h-screen bg-gray-100">
          <div className="flex flex-col min-h-screen bg-white">
            <Navigation />
            <Routes>
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/enhanced-events" element={<EnhancedEventsPage />} />
              <Route path="/enhanced-events/:id" element={<EnhancedEventDetailPage />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:id/edit" element={<EventAdminForm />} />
              <Route path="/manage/events-builder" element={<EventsBuilderPage />} />
              <Route path="/manage/events/:id/reminders" element={<EventRemindersPage />} />
              <Route path="/manage/events/:id/registrations" element={<ManageRegistrations />} />
              <Route path="/manage/forms" element={<FormsPage />} />
              <Route path="/manage/forms/new" element={<NewFormPage />} />
              <Route path="/manage/forms/:id" element={<FormDetailPage />} />
              <Route path="/manage/forms/:id/edit" element={<FormEditPage />} />
              <Route path="/manage/forms/test/rich-text" element={<EnhancedRichTextTest />} />
              <Route path="/manage/users" element={<UserManagementPage />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/registrations" element={<MyRegistrations />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<EventsPage />} />
            </Routes>
          </div>
        </div>
        </UserManagementProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
