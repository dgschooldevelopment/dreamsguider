import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';
import { MyCourseItem } from '../../types';
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      const data = await courseService.getMyCourses();
      setEnrolledCourses(data);
    } catch (err) {
      console.error('Failed to load enrolled courses', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute overall learning metrics
  const totalCourses = enrolledCourses.length;
  const completedTopicsCount = enrolledCourses.reduce((acc, c) => acc + c.completedTopics, 0);
  const totalTopicsCount = enrolledCourses.reduce((acc, c) => acc + c.totalTopics, 0);
  const averageProgress = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;
  const inProgressCourses = enrolledCourses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length;

  const activeCourse = enrolledCourses.find((c) => c.progressPercent < 100) || enrolledCourses[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10">
            Student Learning Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome back, {user?.name}! 🎓
          </h1>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed">
            Pick up right where you left off. Watch latest video lectures uploaded by your instructors and complete course assignments.
          </p>

          {activeCourse && (
            <div className="mt-5 flex items-center space-x-3">
              <Link
                to={`/learn/${activeCourse.course.slug}`}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-all shadow-md group"
              >
                <PlayCircle className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>Continue Learning: {activeCourse.course.title.slice(0, 30)}...</span>
              </Link>
            </div>
          )}
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Allocated Courses</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalCourses}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active enrollments</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Lessons</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {completedTopicsCount} <span className="text-sm font-semibold text-slate-400">/ {totalTopicsCount}</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {averageProgress}% overall completion
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">In Progress</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{inProgressCourses}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Courses being studied</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Course Assignments</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {enrolledCourses.reduce((acc, c) => acc + c.totalAssignments, 0)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Available challenges</span>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Allocated Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any course to view syllabus, watch lectures, and submit assignments.
            </p>
          </div>
          <Link
            to="/my-courses"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800">No courses allocated yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your instructor/admin will allocate courses to your account shortly. When they do, you'll receive a real-time notification!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((item) => {
              const course = item.course;
              return (
                <div
                  key={item.enrollmentId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <img
                        src={
                          course.thumbnail?.startsWith('/uploads')
                            ? `http://localhost:5000${course.thumbnail}`
                            : course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                          {course.category}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-md">
                          {item.progressPercent}% Done
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-600">Course Progress</span>
                          <span className="font-bold text-indigo-600">
                            {item.completedTopics} of {item.totalTopics} lectures
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      to={`/learn/${course.slug}`}
                      className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{item.progressPercent > 0 ? 'Resume Course' : 'Start Course'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
