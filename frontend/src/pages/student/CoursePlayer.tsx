import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { assignmentService } from '../../services/assignmentService';
import { Course, Module, Topic, Assignment } from '../../types';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  Upload,
  ExternalLink,
  Sparkles,
  Check,
  Send,
  Award,
} from 'lucide-react';

export const CoursePlayer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTopicId = searchParams.get('topicId');

  const [course, setCourse] = useState<Course | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments'>('overview');
  const [loading, setLoading] = useState(true);

  // Accordion state: map moduleId -> boolean
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // Assignments for this course
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (slug) {
      loadCourseData();
    }
  }, [slug]);

  const loadCourseData = async () => {
    if (!slug) return;
    try {
      const courseData = await courseService.getCourseDetail(slug);
      setCourse(courseData);

      // Open all modules by default
      const initialOpen: Record<string, boolean> = {};
      courseData.modules?.forEach((m) => {
        initialOpen[m.id] = true;
      });
      setOpenModules(initialOpen);

      // Select initial topic
      let topicToSelect: Topic | null = null;
      if (requestedTopicId) {
        courseData.modules?.forEach((m) => {
          const found = m.topics.find((t) => t.id === requestedTopicId);
          if (found) topicToSelect = found;
        });
      }

      if (!topicToSelect && courseData.modules && courseData.modules.length > 0) {
        // Pick first uncompleted topic or first topic
        const allTopics = courseData.modules.flatMap((m) => m.topics);
        topicToSelect = allTopics.find((t) => !t.isCompleted) || allTopics[0] || null;
      }

      setActiveTopic(topicToSelect);

      // Load assignments for this course
      const assignData = await assignmentService.getStudentAssignments(courseData.id);
      setAssignments(assignData);
    } catch (err) {
      console.error('Failed to load course player', err);
    } finally {
      setLoading(false);
    }
  };

  const allTopics = course?.modules?.flatMap((m) => m.topics) || [];
  const currentTopicIndex = activeTopic ? allTopics.findIndex((t) => t.id === activeTopic.id) : -1;
  const completedTopicsCount = allTopics.filter((t) => t.isCompleted).length;
  const progressPercentage = allTopics.length > 0 ? Math.round((completedTopicsCount / allTopics.length) * 100) : 0;

  const toggleModuleAccordion = (moduleId: string) => {
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleSelectTopic = (topic: Topic) => {
    if (topic.isLocked) return;
    setActiveTopic(topic);
    setSearchParams({ topicId: topic.id });
  };

  const handleToggleCompletion = async (topicId: string, currentStatus: boolean) => {
    try {
      await curriculumService.updateProgress(topicId, { isCompleted: !currentStatus });

      // Update in local state
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules?.map((m) => ({
            ...m,
            topics: m.topics.map((t) => (t.id === topicId ? { ...t, isCompleted: !currentStatus } : t)),
          })),
        };
      });

      if (activeTopic?.id === topicId) {
        setActiveTopic((prev) => (prev ? { ...prev, isCompleted: !currentStatus } : prev));
      }
    } catch (err) {
      console.error('Failed to update completion status', err);
    }
  };

  const handleNextLesson = async () => {
    if (!activeTopic) return;
    // Mark current as completed
    if (!activeTopic.isCompleted) {
      await handleToggleCompletion(activeTopic.id, false);
    }
    // Advance to next
    if (currentTopicIndex < allTopics.length - 1) {
      const nextTopic = allTopics[currentTopicIndex + 1];
      handleSelectTopic(nextTopic);
    }
  };

  const handlePrevLesson = () => {
    if (currentTopicIndex > 0) {
      const prevTopic = allTopics[currentTopicIndex - 1];
      handleSelectTopic(prevTopic);
    }
  };

  const handleAssignmentSubmit = async (assignmentId: string) => {
    const text = submissionTexts[assignmentId] || '';
    const file = submissionFiles[assignmentId] || null;

    if (!text && !file) {
      alert('Please provide written answer text or upload a project file.');
      return;
    }

    setSubmittingAssignmentId(assignmentId);
    try {
      const formData = new FormData();
      if (text) formData.append('submissionText', text);
      if (file) formData.append('file', file);

      await assignmentService.submitAssignment(assignmentId, formData);

      // Refresh assignments
      if (course) {
        const assignData = await assignmentService.getStudentAssignments(course.id);
        setAssignments(assignData);
      }
      alert('Assignment submitted successfully!');
    } catch (err) {
      console.error('Submission failed', err);
      alert('Failed to submit assignment');
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Course not found</h2>
        <Link to="/my-courses" className="text-indigo-600 text-xs font-bold mt-2 inline-block">
          Return to enrolled courses
        </Link>
      </div>
    );
  }

  // Helper to parse video source
  const getVideoSrc = (url?: string | null) => {
    if (!url) return null;
    return url;
  };

  const isYouTubeUrl = (url?: string | null) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Progress Bar Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/my-courses"
            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to My Courses</span>
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{course.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Topic {currentTopicIndex + 1} of {allTopics.length}: {activeTopic?.title || 'Course Overview'}
          </p>
        </div>

        {/* Course Progress Indicator */}
        <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-slate-600">Course Progress</span>
              <span className="text-indigo-600">{progressPercentage}%</span>
            </div>
            <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {completedTopicsCount}/{allTopics.length} Done
          </span>
        </div>
      </div>

      {/* Main Two-Column Classroom Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Player & Tabs (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Container */}
          <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl relative border border-slate-800 flex items-center justify-center">
            {activeTopic?.isLocked ? (
              <div className="text-center p-8 text-white">
                <Lock className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <h3 className="font-bold text-base">Lecture Locked</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  This topic is locked. Please ensure you are enrolled in this course to access all lectures.
                </p>
              </div>
            ) : !activeTopic?.videoUrl ? (
              <div className="text-center p-8 text-white">
                <PlayCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="font-bold text-base">Video Lecture Coming Soon</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The instructor has not uploaded a video for this topic yet.
                </p>
              </div>
            ) : isYouTubeUrl(activeTopic.videoUrl) ? (
              <iframe
                src={getYouTubeEmbedUrl(activeTopic.videoUrl)}
                title={activeTopic.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={getVideoSrc(activeTopic.videoUrl) || ''}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Player Action Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrevLesson}
                disabled={currentTopicIndex <= 0}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNextLesson}
                disabled={currentTopicIndex >= allTopics.length - 1}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 transition-colors inline-flex items-center space-x-1"
              >
                <span>Next Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mark as Completed Toggle */}
            {activeTopic && (
              <button
                onClick={() => handleToggleCompletion(activeTopic.id, !!activeTopic.isCompleted)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all inline-flex items-center space-x-2 ${
                  activeTopic.isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{activeTopic.isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
              </button>
            )}
          </div>

          {/* Bottom Tabs: Overview & Notes VS Assignments */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Lecture Notes & Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                  activeTab === 'assignments'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Course Assignments ({assignments.length})</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{activeTopic?.title}</h3>
                    {activeTopic?.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {activeTopic.description}
                      </p>
                    )}
                  </div>

                  {activeTopic?.notes ? (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                      {activeTopic.notes}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes provided for this topic.</p>
                  )}
                </div>
              ) : (
                /* Assignments Solver Section */
                <div className="space-y-6">
                  {assignments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No assignments assigned for this course yet.
                    </p>
                  ) : (
                    assignments.map((assignment) => {
                      const submission = assignment.submission;
                      const isGraded = submission?.status === 'GRADED';
                      const isPending = submission?.status === 'PENDING';

                      return (
                        <div
                          key={assignment.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  {assignment.maxScore} Points
                                </span>
                                {isGraded && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Score: {submission.score} / {assignment.maxScore}
                                  </span>
                                )}
                                {isPending && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Submitted - Pending Instructor Review
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-base text-slate-900 mt-1.5">
                                {assignment.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {assignment.description}
                              </p>
                            </div>
                          </div>

                          {/* Instructor Feedback if Graded */}
                          {isGraded && submission.feedback && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                              <span className="font-bold block">Instructor Feedback:</span>
                              <p className="mt-0.5">{submission.feedback}</p>
                            </div>
                          )}

                          {/* Solution Submission Form */}
                          <div className="pt-3 border-t border-slate-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-700">
                              Your Solution (Text / GitHub link / Code):
                            </label>
                            <textarea
                              rows={3}
                              value={
                                submissionTexts[assignment.id] !== undefined
                                  ? submissionTexts[assignment.id]
                                  : submission?.submissionText || ''
                              }
                              onChange={(e) =>
                                setSubmissionTexts({ ...submissionTexts, [assignment.id]: e.target.value })
                              }
                              placeholder="Paste your GitHub repository URL, live deployment link, or write explanation..."
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
                            />

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <label className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-sm">
                                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                <span>
                                  {submissionFiles[assignment.id]
                                    ? submissionFiles[assignment.id]?.name
                                    : 'Attach File (ZIP / PDF / Image)'}
                                </span>
                                <input
                                  type="file"
                                  onChange={(e) =>
                                    setSubmissionFiles({
                                      ...submissionFiles,
                                      [assignment.id]: e.target.files?.[0] || null,
                                    })
                                  }
                                  className="sr-only"
                                />
                              </label>

                              <button
                                onClick={() => handleAssignmentSubmit(assignment.id)}
                                disabled={submittingAssignmentId === assignment.id}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all inline-flex items-center space-x-1.5 disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>
                                  {submittingAssignmentId === assignment.id
                                    ? 'Submitting...'
                                    : submission
                                    ? 'Re-submit Solution'
                                    : 'Submit Assignment'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Course Curriculum & Syllabus Tree Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Course Syllabus</h3>
              <span className="text-xs text-slate-400 font-semibold">
                {course.modules?.length || 0} Modules
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {course.modules?.map((mod, modIdx) => {
                const isOpen = openModules[mod.id] ?? true;
                const modCompleted = mod.topics.filter((t) => t.isCompleted).length;

                return (
                  <div
                    key={mod.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                  >
                    {/* Chapter Header */}
                    <button
                      onClick={() => toggleModuleAccordion(mod.id)}
                      className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex-1 pr-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                          Module {modIdx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mt-0.5">
                          {mod.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {modCompleted}/{mod.topics.length} completed
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Topics List */}
                    {isOpen && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {mod.topics.map((topic) => {
                          const isCurrent = activeTopic?.id === topic.id;
                          return (
                            <div
                              key={topic.id}
                              onClick={() => handleSelectTopic(topic)}
                              className={`p-3 flex items-start space-x-2.5 cursor-pointer transition-all ${
                                isCurrent
                                  ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Completion checkbox button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCompletion(topic.id, !!topic.isCompleted);
                                }}
                                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                  topic.isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-indigo-500'
                                }`}
                              >
                                {topic.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-semibold line-clamp-2 ${
                                    isCurrent ? 'text-indigo-950 font-bold' : 'text-slate-700'
                                  }`}
                                >
                                  {topic.title}
                                </p>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-0.5" />
                                    {Math.round(topic.duration / 60)} min
                                  </span>
                                  {topic.videoUrl ? (
                                    <span className="text-indigo-600 font-semibold">Video</span>
                                  ) : (
                                    <span className="text-slate-400">Notes</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
