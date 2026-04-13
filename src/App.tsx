import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlobalBanner from './components/GlobalBanner';
import SupportCenter from './components/SupportCenter';
import Home from './pages/Home';
import ProfilePage from './pages/Profile';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminOrders from './pages/Admin/Orders';
import AdminSettings from './pages/Admin/Settings';
import AdminUsers from './pages/Admin/Users';
import AdminReviews from './pages/Admin/Reviews';
import AddCourse from './pages/Admin/AddCourse';
import AddFile from './pages/Admin/AddFile';
import AddHardware from './pages/Admin/AddHardware';
import AdminLogs from './pages/Admin/Logs';
import AdminAnnouncements from './pages/Admin/Announcements';
import AdminWithdrawals from './pages/Admin/Withdrawals';
import AdminPointsSettings from './pages/Admin/PointsSettings';
import AdminCoinSettings from './pages/Admin/CoinSettings';
import ProductDetails from './pages/ProductDetails';
import Learning from './pages/Learning';
import Checkout from './pages/Checkout';
import AuthPage from './pages/Auth';
import Leaderboard from './pages/Leaderboard';
import UserProfile from './pages/UserProfile';
import { HelmetProvider, SEOHelmet } from './components/SEOHelmet';
import ScrollToTop from './components/ScrollToTop';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      // Ensure user has a referral code
      if (!data.referral_code) {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', userId)
          .select()
          .single();
        if (updatedProfile) setProfile(updatedProfile);
      } else {
        setProfile(data);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cyber-black text-cyber-purple font-mono">LOADING_SYSTEM...</div>;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  
  // If user is logged in but has no profile, force them to profile page (unless they are already there)
  if (!profile && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  const isLocalAdmin = localStorage.getItem('admin_auth') === 'true';
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cyber-black text-cyber-purple font-mono">VERIFYING_AUTHORITY...</div>;
  
  const hasDbAdminRole = profile && (profile.role === 'admin' || profile.role === 'owner' || profile.role === 'developer');

  if (!isLocalAdmin && !hasDbAdminRole) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

import { LocalizationProvider } from './context/LocalizationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const ReferralTracker: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    const affiliate = params.get('aff');
    
    if (ref) {
      sessionStorage.setItem('referred_by_code', ref);
    }
    if (affiliate) {
      sessionStorage.setItem('affiliate_id', affiliate);
    }
  }, [location]);

  return null;
};

const AppContent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
      <ReferralTracker />
      <SEOHelmet />
      <GlobalBanner />
      <Navbar />
      <main className="flex-grow py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/checkout/:id" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/learning/:id" element={
            <ProtectedRoute>
              <Learning />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/reviews" element={
            <AdminRoute>
              <AdminReviews />
            </AdminRoute>
          } />
          <Route path="/admin/products/add-course" element={
            <AdminRoute>
              <AddCourse />
            </AdminRoute>
          } />
          <Route path="/admin/products/add-file" element={
            <AdminRoute>
              <AddFile />
            </AdminRoute>
          } />
          <Route path="/admin/products/add-hardware" element={
            <AdminRoute>
              <AddHardware />
            </AdminRoute>
          } />
          <Route path="/admin/logs" element={
            <AdminRoute>
              <AdminLogs />
            </AdminRoute>
          } />
          <Route path="/admin/announcements" element={
            <AdminRoute>
              <AdminAnnouncements />
            </AdminRoute>
          } />
          <Route path="/admin/withdrawals" element={
            <AdminRoute>
              <AdminWithdrawals />
            </AdminRoute>
          } />
          <Route path="/admin/points-settings" element={
            <AdminRoute>
              <AdminPointsSettings />
            </AdminRoute>
          } />
          <Route path="/admin/coin-settings" element={
            <AdminRoute>
              <AdminCoinSettings />
            </AdminRoute>
          } />
        </Routes>
      </main>
      <Footer />
      <SupportCenter />
      <Toaster position="bottom-right" theme={resolvedTheme} richColors />
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
