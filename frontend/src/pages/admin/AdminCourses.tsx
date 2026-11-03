import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { getMediaUrl, DEFAULT_COURSE_THUMBNAIL } from '../../services/api';
import { Course } from '../../types';
import {
  Plus,
  BookOpen,
  Video,
  Users,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  X,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [level, setLevel] = useState('Beginner');
  const [duration, setDuration] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setTitle(course.title);
      setDescription(course.description);
      setCategory(course.category);
      setLevel(course.level);
      setDuration(course.duration || '');
      setThumbnailUrl(course.thumbnail || '');
      setThumbnailFile(null);
    } else {
      setEditingCourse(null);
      setTitle('');
      setDescription('');
      setCategory('Web Development');
      setLevel('Beginner');
      setDuration('');
      setThumbnailUrl('');
      setThumbnailFile(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('level', level);
      formData.append('duration', duration);

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl) {
        formData.append('thumbnail', thumbnailUrl);
      }

      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, formData);
      } else {
        await courseService.createCourse(formData);
      }

      setIsModalOpen(false);
      await loadCourses();
    } catch (err) {
      console.error('Failed to save course', err);
      alert('Error saving course. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? All syllabus topics, video files, and enrollments will be removed.`)) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Failed to delete course', err);
      alert('Failed to delete course');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses & Syllabus Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create courses, structure curriculum modules, and upload lecture videos for specific topics.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No courses yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Click 'Create New Course' to launch your first educational curriculum on DreamsGuider.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                <img
                  src={getMediaUrl(course.thumbnail)}
                  alt={course.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                    {course.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    {course.level}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Course Metadata Stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block font-black text-slate-900">{course.stats?.totalModules || 0}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Chapters</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block font-black text-indigo-600">{course.stats?.totalTopics || 0}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Lectures</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block font-black text-emerald-600">{course.stats?.totalEnrollments || 0}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Students</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/courses/${course.id}/curriculum`}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Manage Syllabus & Videos</span>
                  </Link>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenModal(course)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Edit Course Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Course */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in course details. You can add chapters & syllabus videos right after creation.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Full Stack Web Development"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will students learn in this course?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Design & UI/UX">Design & UI/UX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 35 Hours, 12 Weeks"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thumbnail Image (File or URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center space-x-1 border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                </div>
                {thumbnailFile && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Selected file: {thumbnailFile.name}
                  </p>
                )}

                {(thumbnailFile || (thumbnailUrl && thumbnailUrl.trim())) && (
                  <div className="mt-2.5 relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : getMediaUrl(thumbnailUrl)}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                      }}
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] bg-slate-900/80 text-white px-2 py-0.5 rounded font-medium">
                      Live Preview
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
