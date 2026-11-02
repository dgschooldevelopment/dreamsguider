import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck2,
  Video,
  Sparkles,
  Award,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Courses & Syllabus', icon: BookOpen },
    { to: '/admin/users', label: 'Users & Course Allocation', icon: Users },
    { to: '/admin/assignments', label: 'Assignments Review', icon: FileCheck2 },
  ];

  const studentLinks = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/my-courses', label: 'Enrolled Courses', icon: Video },
    { to: '/assignments', label: 'My Assignments', icon: Award },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'Administration' : 'Learning Area'}
              </p>
              <nav className="mt-2 space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/admin' || link.to === '/dashboard'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Quick Helper card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>DreamsGuider Pro</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {isAdmin
                  ? 'Add syllabus chapters, upload topic videos, and allocate courses with real-time student notifications.'
                  : 'Watch video lectures, submit chapter assignments, and track your completion progress.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              DreamsGuider v1.0 • Education
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
