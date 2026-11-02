import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { MyCourseItem, Assignment } from '../../types';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Upload,
  Send,
  X,
  ExternalLink,
} from 'lucide-react';

export const StudentAssignments: React.FC = () => {
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Solve Modal
  const [solvingAssignment, setSolvingAssignment] = useState<Assignment | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllAssignments();
  }, []);

  const loadAllAssignments = async () => {
    try {
      const myCourses = await courseService.getMyCourses();
      setCourses(myCourses);

      // Fetch assignments for all courses
      const allList: Assignment[] = [];
      for (const item of myCourses) {
        const list = await assignmentService.getStudentAssignments(item.course.id);
        const mapped = list.map((a) => ({
          ...a,
          course: { id: item.course.id, title: item.course.title },
        }));
        allList.push(...mapped);
      }
      setAssignments(allList);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSolveModal = (assignment: Assignment) => {
    setSolvingAssignment(assignment);
    setSolutionText(assignment.submission?.submissionText || '');
    setSolutionFile(null);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solvingAssignment) return;
    if (!solutionText && !solutionFile) {
      alert('Please enter solution text or attach a file');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (solutionText) formData.append('submissionText', solutionText);
      if (solutionFile) formData.append('file', solutionFile);

      await assignmentService.submitAssignment(solvingAssignment.id, formData);
      await loadAllAssignments();
      setSolvingAssignment(null);
    } catch (err) {
      console.error('Submit error', err);
      alert('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments =
    selectedCourseId === 'all'
      ? assignments
      : assignments.filter((a) => a.courseId === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignments & Homework</h1>
          <p className="text-xs text-slate-500 mt-1">
            Solve project challenges, submit code & repositories, and receive instructor grades.
          </p>
        </div>

        {/* Filter by course */}
        {courses.length > 0 && (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          >
            <option value="all">All Enrolled Courses</option>
            {courses.map((c) => (
              <option key={c.course.id} value={c.course.id}>
                {c.course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Award className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No assignments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Your instructors haven't posted any assignments for your enrolled courses yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const submission = assignment.submission;
            const isGraded = submission?.status === 'GRADED';
            const isPending = submission?.status === 'PENDING';

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {assignment.course?.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {assignment.maxScore} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-2 line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {assignment.description}
                  </p>

                  {/* Submission Status Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isGraded ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Scored {submission.score}/{assignment.maxScore}
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Submitted
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        Not Submitted
                      </span>
                    )}

                    {assignment.dueDate && (
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {isGraded && submission.feedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900">
                      <span className="font-bold block">Feedback:</span>
                      {submission.feedback}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => handleOpenSolveModal(assignment)}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
                  >
                    <span>{submission ? 'View / Update Solution' : 'Solve & Submit'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Solve / Submit Modal */}
      {solvingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setSolvingAssignment(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Assignment Solver
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {solvingAssignment.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{solvingAssignment.description}</p>
            </div>

            <form onSubmit={handleSubmitSolution} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Answer / GitHub Repo / Deployment Link *
                </label>
                <textarea
                  rows={4}
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Paste GitHub repository, Vercel/Netlify link, or write your solution code/explanation here..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Project File / Screenshot (ZIP, PDF, Code, Images)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-semibold">
                    {solutionFile ? solutionFile.name : 'Select file to upload'}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                    className="mt-2 text-xs text-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSolvingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Solution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
