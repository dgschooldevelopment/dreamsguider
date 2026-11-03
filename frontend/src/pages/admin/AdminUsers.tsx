import React, { useState, useEffect } from 'react';
import { enrollmentService } from '../../services/enrollmentService';
import { courseService } from '../../services/courseService';
import { User, Course } from '../../types';
import {
  Users,
  UserPlus,
  BookOpen,
  CheckCircle,
  Search,
  Phone,
  Shield,
  X,
  Sparkles,
  ArrowRight,
  Plus,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Allocation Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [allocating, setAllocating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add Student Modal State (Admin Only)
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('student123');
  const [selectedCoursesToEnroll, setSelectedCoursesToEnroll] = useState<string[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentSuccessMessage, setStudentSuccessMessage] = useState('');
  const [studentError, setStudentError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, coursesData] = await Promise.all([
        enrollmentService.getAllUsers(),
        courseService.getAllCourses(),
      ]);
      setUsers(usersData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to load user and course data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllocateModal = (userId?: string) => {
    if (userId) setSelectedUserId(userId);
    else if (users.length > 0) setSelectedUserId(users[0].id);

    if (courses.length > 0) setSelectedCourseId(courses[0].id);
    setSuccessMessage('');
    setIsAllocateModalOpen(true);
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedCourseId) return;
    setAllocating(true);

    try {
      const result = await enrollmentService.allocateCourse(selectedUserId, selectedCourseId);
      setSuccessMessage(result.message || 'Course successfully allocated! User notified.');
      await loadData();
      setTimeout(() => {
        setIsAllocateModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      console.error('Allocation error', err);
      alert(err.response?.data?.message || 'Failed to allocate course');
    } finally {
      setAllocating(false);
    }
  };

  const handleOpenAddStudentModal = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setStudentPassword('student123');
    setSelectedCoursesToEnroll([]);
    setStudentError('');
    setStudentSuccessMessage('');
    setIsAddStudentModalOpen(true);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setAddingStudent(true);

    try {
      const result = await enrollmentService.createStudent({
        name: studentName,
        email: studentEmail,
        phone: studentPhone || undefined,
        password: studentPassword,
        courseIds: selectedCoursesToEnroll,
      });

      setStudentSuccessMessage(result.message || 'Student added successfully!');
      await loadData();

      setTimeout(() => {
        setIsAddStudentModalOpen(false);
        setStudentSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setStudentError(err.response?.data?.message || 'Failed to add student. Please check inputs.');
    } finally {
      setAddingStudent(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    if (selectedCoursesToEnroll.includes(courseId)) {
      setSelectedCoursesToEnroll(selectedCoursesToEnroll.filter((id) => id !== courseId));
    } else {
      setSelectedCoursesToEnroll([...selectedCoursesToEnroll, courseId]);
    }
  };

  const handleRevoke = async (userId: string, courseId: string, courseTitle: string) => {
    if (!window.confirm(`Revoke access to "${courseTitle}" for this student?`)) return;

    try {
      await enrollmentService.revokeAccess(userId, courseId);
      await loadData();
    } catch (err) {
      console.error('Revoke error', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student & User Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Add new students directly, allocate courses, and manage their learning permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenAddStudentModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>

          <button
            onClick={() => handleOpenAllocateModal()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Allocate Course</span>
          </button>
        </div>
      </div>

      {/* Search and Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full text-sm outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">User / Student</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6">Allocated Courses</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {user.role === 'ADMIN' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" /> Admin
                          </>
                        ) : (
                          '🎓 Student'
                        )}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {user.phone ? (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No phone</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {(!user.enrollments || user.enrollments.length === 0) ? (
                          <span className="text-slate-400 italic text-[11px]">No courses allocated</span>
                        ) : (
                          user.enrollments.map((enr) => (
                            <span
                              key={enr.id}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-500" />
                              <span className="line-clamp-1 max-w-[140px]">{enr.course?.title}</span>
                              <button
                                onClick={() => handleRevoke(user.id, enr.courseId, enr.course?.title || '')}
                                title="Revoke course access"
                                className="text-indigo-400 hover:text-rose-600 ml-1 cursor-pointer"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenAllocateModal(user.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Allocate Course</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add New Student (Admin Only) */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setIsAddStudentModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
                <p className="text-xs text-slate-500">
                  Create student profile and assign course access
                </p>
              </div>
            </div>

            {studentSuccessMessage ? (
              <div className="mt-6 p-6 text-center animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-900">{studentSuccessMessage}</h3>
                <p className="text-xs text-slate-500 mt-1">Student can now sign in using their email and password.</p>
              </div>
            ) : (
              <form onSubmit={handleAddStudentSubmit} className="mt-5 space-y-3.5">
                {studentError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {studentError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Ramesh Kadam"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional instant course allocations */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign Courses (Optional)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                    {courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center space-x-2 text-xs font-medium text-slate-700 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCoursesToEnroll.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="line-clamp-1">{course.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingStudent}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{addingStudent ? 'Creating...' : 'Create Student Account'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Allocate Existing Course */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsAllocateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Allocate Course Access</h2>
                <p className="text-xs text-slate-500">
                  Assign educational access to student
                </p>
              </div>
            </div>

            {successMessage ? (
              <div className="mt-6 p-6 text-center animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-900">{successMessage}</h3>
                <p className="text-xs text-slate-500 mt-1">Student has been notified in real time.</p>
              </div>
            ) : (
              <form onSubmit={handleAllocate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Student *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {users
                      .filter((u) => u.role === 'STUDENT')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Course to Allocate *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                  <span className="font-bold block">Instant Notification:</span>
                  The student will immediately see this course on their dashboard and receive an in-app notification.
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAllocateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={allocating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{allocating ? 'Allocating...' : 'Allocate Access'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
