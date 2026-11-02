import React, { useState, useEffect } from 'react';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { Assignment, AssignmentSubmission, Course } from '../../types';
import {
  FileCheck2,
  Plus,
  BookOpen,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const AdminAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Submissions Modal
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grade Modal
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState('90');
  const [gradeFeedback, setGradeFeedback] = useState('Great work! Your solution is well-structured.');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        assignmentService.getAssignments(),
        courseService.getAllCourses(),
      ]);
      setAssignments(assignmentsData);
      setCourses(coursesData);
      if (coursesData.length > 0 && !courseId) {
        setCourseId(coursesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !description) return;
    setCreating(true);

    try {
      await assignmentService.createAssignment({
        courseId,
        title,
        description,
        maxScore: Number(maxScore),
        dueDate: dueDate || undefined,
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      console.error('Failed to create assignment', err);
      alert('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionsLoading(true);
    try {
      const data = await assignmentService.getSubmissionsForAssignment(assignment.id);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleOpenGradeModal = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission);
    setGradeScore(String(submission.score || 90));
    setGradeFeedback(submission.feedback || 'Well done! Clean implementation.');
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGrading(true);

    try {
      await assignmentService.gradeSubmission(gradingSubmission.id, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
        status: 'GRADED',
      });

      // Refresh submissions
      if (selectedAssignment) {
        const updated = await assignmentService.getSubmissionsForAssignment(selectedAssignment.id);
        setSubmissions(updated);
      }

      setGradingSubmission(null);
    } catch (err) {
      console.error('Failed to grade submission', err);
      alert('Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignment Management & Grading</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create homework tasks for courses, review student submissions, and send scores with feedback.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileCheck2 className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No assignments created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Click 'Create New Assignment' to post homework or code challenges for your students.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {assignment.course?.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Max: {assignment.maxScore} pts
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-2 line-clamp-1">
                  {assignment.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {assignment.description}
                </p>

                {assignment.dueDate && (
                  <div className="flex items-center space-x-1.5 text-xs text-amber-700 font-semibold mt-3 bg-amber-50 px-2.5 py-1 rounded-xl w-fit">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  Submissions: <strong className="text-indigo-600">{assignment._count?.submissions || 0}</strong>
                </span>

                <button
                  onClick={() => handleViewSubmissions(assignment)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Review Submissions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Review Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Submissions Review
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedAssignment.title}</h2>
              <p className="text-xs text-slate-500">Max Score: {selectedAssignment.maxScore} points</p>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {submissionsLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400 italic">
                  No students have submitted solutions for this assignment yet.
                </p>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {sub.user?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{sub.user?.name}</p>
                          <p className="text-[11px] text-slate-400">{sub.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {sub.status === 'GRADED' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Graded: {sub.score}/{selectedAssignment.maxScore}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenGradeModal(sub)}
                          className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold"
                        >
                          {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                        </button>
                      </div>
                    </div>

                    {/* Submission text & attachment */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap font-mono">
                      {sub.submissionText || 'No text note provided.'}
                    </div>

                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Download Student Attached File</span>
                      </a>
                    )}

                    {sub.feedback && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs">
                        <strong>Instructor Feedback:</strong> {sub.feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setGradingSubmission(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Grade Submission: {gradingSubmission.user?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter score and feedback comments. The student will be notified immediately.
            </p>

            <form onSubmit={handleGradeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Score (out of {selectedAssignment?.maxScore || 100}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={selectedAssignment?.maxScore || 100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instructor Feedback & Suggestions
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide constructive review comments for student..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {grading ? 'Saving...' : 'Save Grade & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900">Create New Assignment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set tasks or project challenges for your course
            </p>

            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build a Responsive Landing Page"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instructions & Requirements *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe requirements, deliverables, GitHub link instructions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
