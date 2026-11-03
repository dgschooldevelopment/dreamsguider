import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { Course, Module, Topic } from '../../types';
import {
  ArrowLeft,
  Plus,
  Video,
  FileText,
  Upload,
  PlayCircle,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  X,
  Bell,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export const AdminCurriculum: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Module Modal state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  // Topic & Video Upload Modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [topicNotes, setTopicNotes] = useState('');
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [notificationDispatched, setNotificationDispatched] = useState(false);

  // Video preview player
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;
    try {
      const data = await courseService.getCourseDetail(id);
      setCourse(data);
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !moduleTitle) return;
    setModuleSubmitting(true);

    try {
      await curriculumService.createModule({
        courseId: course.id,
        title: moduleTitle,
        description: moduleDesc,
      });

      setIsModuleModalOpen(false);
      setModuleTitle('');
      setModuleDesc('');
      await loadCourse();
    } catch (err) {
      console.error('Failed to create module', err);
      alert('Failed to add module');
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!window.confirm(`Delete "${moduleName}" and all its topics?`)) return;
    try {
      await curriculumService.deleteModule(moduleId);
      await loadCourse();
    } catch (err) {
      console.error('Failed to delete module', err);
    }
  };

  const handleOpenTopicModal = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setTopicTitle('');
    setTopicDesc('');
    setVideoUrl('');
    setVideoFile(null);
    setDurationMinutes('15');
    setTopicNotes('');
    setNotificationDispatched(false);
    setIsTopicModalOpen(true);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !topicTitle) return;
    setTopicSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('moduleId', selectedModuleId);
      formData.append('title', topicTitle);
      formData.append('description', topicDesc);
      formData.append('duration', String(Number(durationMinutes || 0) * 60));
      formData.append('notes', topicNotes);

      if (videoMode === 'upload' && videoFile) {
        formData.append('video', videoFile);
      } else if (videoMode === 'url' && videoUrl) {
        formData.append('videoUrl', videoUrl);
        formData.append('videoType', 'url');
      }

      await curriculumService.createTopic(formData);
      setNotificationDispatched(true);

      setTimeout(async () => {
        setIsTopicModalOpen(false);
        await loadCourse();
      }, 1500);
    } catch (err) {
      console.error('Failed to create topic & upload video', err);
      alert('Failed to upload video topic');
      setTopicSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, topicName: string) => {
    if (!window.confirm(`Delete topic "${topicName}"?`)) return;
    try {
      await curriculumService.deleteTopic(topicId);
      await loadCourse();
    } catch (err) {
      console.error('Failed to delete topic', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-800">Course not found</h2>
        <Link to="/admin/courses" className="text-indigo-600 text-xs font-semibold mt-2 inline-block">
          Return to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/courses"
            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to All Courses</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Syllabus Editor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize syllabus into modules, upload video lectures, and notify enrolled students in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsModuleModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Chapter / Module</span>
        </button>
      </div>

      {/* Modules & Topics Tree */}
      {(!course.modules || course.modules.length === 0) ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No syllabus modules created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Start structuring your course by adding your first chapter (e.g. "Module 1: Getting Started").
          </p>
          <button
            onClick={() => setIsModuleModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter 1</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {course.modules.map((mod, modIdx) => (
            <div
              key={mod.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              {/* Module Header Bar */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                      Module {modIdx + 1}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{mod.title}</h2>
                  </div>
                  {mod.description && (
                    <p className="text-xs text-slate-500 mt-1">{mod.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenTopicModal(mod.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video / Topic</span>
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Topics inside Module */}
              <div className="p-4">
                {(!mod.topics || mod.topics.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">
                    No topic lectures in this module. Click 'Upload Video / Topic' to add one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {mod.topics.map((topic, topIdx) => (
                      <div
                        key={topic.id}
                        className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5 flex-shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-800">
                                {topic.title}
                              </span>
                              {topic.videoUrl ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Video Available
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                  No Video
                                </span>
                              )}
                            </div>
                            {topic.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {topic.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                {Math.round(topic.duration / 60)} mins
                              </span>
                              {topic.notes && (
                                <span className="flex items-center text-indigo-600 font-medium">
                                  <FileCode className="w-3 h-3 mr-1" />
                                  Includes Notes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          {topic.videoUrl && (
                            <button
                              onClick={() => {
                                setPreviewVideoUrl(topic.videoUrl || null);
                              }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                            >
                              <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Preview</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTopic(topic.id, topic.title)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Module */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModuleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Add New Module / Chapter</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Group topics into meaningful syllabus sections.
            </p>

            <form onSubmit={handleCreateModule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Module 3: Advanced React Patterns"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="Summary of concepts covered in this chapter"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moduleSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {moduleSubmitting ? 'Creating...' : 'Add Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Topic & Video Upload Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setIsTopicModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upload Topic Video</h2>
                <p className="text-xs text-slate-500">
                  Add video lecture and notes to the syllabus
                </p>
              </div>
            </div>

            {/* Notification Alert Banner */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-amber-900 text-xs">
              <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Real-time Notification Trigger:</span>
                <p className="text-amber-700 mt-0.5">
                  Uploading this video will instantly broadcast an in-app and push notification to all students enrolled in this course!
                </p>
              </div>
            </div>

            {notificationDispatched ? (
              <div className="p-8 text-center animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Video Uploaded Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled students have been notified in real time.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateTopic} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Topic / Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="e.g. 5. Building REST APIs with Express & Prisma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Topic Summary
                  </label>
                  <textarea
                    rows={2}
                    value={topicDesc}
                    onChange={(e) => setTopicDesc(e.target.value)}
                    placeholder="Brief description of what is covered in this lecture"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Video Source Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Video Source
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        videoMode === 'url'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🔗 Video URL / Embed
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        videoMode === 'upload'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      📁 Upload File (MP4/WebM)
                    </button>
                  </div>

                  {videoMode === 'url' ? (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/... or YouTube/MP4 URL"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-indigo-700 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100 flex items-start space-x-1.5">
                        <span className="font-bold">⚡ Cloudinary Support:</span>
                        <span>
                          Cloudinary video URL टाकल्यास सिस्टीम आपोआप <code>q_auto,f_auto</code> chunk streaming चालू करते, ज्यामुळे इंटरनेट स्लो असले तरी व्हिडिओ अडकणार नाही.
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-400 transition-colors">
                      <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 font-semibold">
                        {videoFile ? videoFile.name : 'Select MP4, WebM, MOV file to upload'}
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        className="mt-2 text-xs text-slate-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Estimated Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lesson Notes / Code Snippets (Markdown)
                  </label>
                  <textarea
                    rows={3}
                    value={topicNotes}
                    onChange={(e) => setTopicNotes(e.target.value)}
                    placeholder="Key points, GitHub repo links, command-line instructions for students"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTopicModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={topicSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{topicSubmitting ? 'Uploading & Notifying...' : 'Save & Publish Video'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-slate-950 rounded-3xl max-w-3xl w-full p-4 relative overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-4 right-4 z-10 text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
