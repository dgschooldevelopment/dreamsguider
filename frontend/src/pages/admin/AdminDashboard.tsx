import React, { useEffect, useState } from 'react';
import { statsService } from '../../services/statsService';
import { AdminStats } from '../../types';
import {
  Users,
  BookOpen,
  Video,
  UserCheck,
  FileCheck2,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Published Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Video Lectures',
      value: stats?.totalTopics || 0,
      icon: Video,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
    {
      title: 'Course Allocations',
      value: stats?.totalEnrollments || 0,
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: 'Submissions to Review',
      value: stats?.pendingSubmissions || 0,
      icon: FileCheck2,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      highlight: (stats?.pendingSubmissions || 0) > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10">
            Instructor Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome to DreamsGuider Admin Panel 🚀
          </h1>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed">
            Manage your course catalog, upload new syllabus video lectures, allocate courses to registered students, and review assignment submissions.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/admin/courses"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Create / Manage Courses</span>
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs transition-all border border-indigo-400/30"
            >
              <UserCheck className="w-4 h-4" />
              <span>Allocate Courses to Students</span>
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-lg ${
                c.highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                <div className={`p-2 rounded-xl ${c.bgColor}`}>
                  <Icon className={`w-4 h-4 ${c.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{c.value}</p>
              <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>Live statistics</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Recent Course Allocations & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Recent Course Allocations</h3>
            <Link
              to="/admin/users"
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 inline-flex items-center"
            >
              <span>Manage Allocations</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(!stats?.recentEnrollments || stats.recentEnrollments.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent course allocations</p>
            ) : (
              stats.recentEnrollments.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.user.name}</p>
                    <p className="text-xs text-indigo-600 font-medium">{item.course.title}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.enrolledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registered Students */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Newly Joined Students</h3>
            <Link
              to="/admin/users"
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 inline-flex items-center"
            >
              <span>View All Users</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(!stats?.recentUsers || stats.recentUsers.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No students registered yet</p>
            ) : (
              stats.recentUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
