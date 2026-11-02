import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { GraduationCap, LogOut, UserCircle, Shield, BookOpen, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Mobile menu toggle */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  DreamsGuider
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-1">
                  Education Academy
                </span>
              </div>
            </Link>
          </div>

          {/* Right section: Role Badge, Notifications, User Profile, Logout */}
          <div className="flex items-center space-x-4">
            {/* Role indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
              {isAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Panel</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Portal</span>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationDropdown />

            {/* User Info & Logout */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5" />}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
