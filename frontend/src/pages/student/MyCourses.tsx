import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { MyCourseItem } from '../../types';
import { BookOpen, PlayCircle, Clock, Award, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getMyCourses()
      .then((data) => setCourses(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Enrolled Courses</h1>
        <p className="text-xs text-slate-500 mt-1">
          All courses allocated to your account by DreamsGuider instructors.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No courses allocated</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Please ask your administrator to allocate courses to your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => (
            <div
              key={item.enrollmentId}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                  <img
                    src={
                      item.course.thumbnail?.startsWith('/uploads')
                        ? `http://localhost:5000${item.course.thumbnail}`
                        : item.course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                      {item.course.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {item.progressPercent}% Completed
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                    {item.course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.course.description}
                  </p>

                  <div className="mt-4">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                      <span>{item.completedTopics} / {item.totalTopics} lectures watched</span>
                      <span>{item.totalAssignments} assignments</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/learn/${item.course.slug}`}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Resume Course</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
