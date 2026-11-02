import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Video, BookOpen, Award, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useNotifications();
  const navigate = useNavigate();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'NEW_VIDEO':
        return <Video className="w-5 h-5 text-indigo-400" />;
      case 'COURSE_ALLOCATED':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'ASSIGNMENT_GRADED':
        return <Award className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleAction = () => {
    if (toast.link) {
      navigate(toast.link);
    }
    dismissToast();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-slate-900 border border-indigo-500/30 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-start space-x-3 relative overflow-hidden">
        {/* Animated glowing bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />

        <div className="p-2.5 bg-indigo-950/80 rounded-xl border border-indigo-500/30 flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 pr-6">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {toast.type.replace('_', ' ')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h4 className="font-bold text-sm text-slate-100 mt-0.5">{toast.title}</h4>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{toast.message}</p>

          {toast.link && (
            <button
              onClick={handleAction}
              className="mt-2.5 inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open Lesson <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          )}
        </div>

        <button
          onClick={dismissToast}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
