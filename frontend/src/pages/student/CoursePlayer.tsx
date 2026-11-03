import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { assignmentService } from '../../services/assignmentService';
import { offlineCache } from '../../services/offlineCache';
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
  Wifi,
  WifiOff,
  RotateCcw,
  RotateCw,
  Gauge,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const CoursePlayer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTopicId = searchParams.get('topicId');

  const [course, setCourse] = useState<Course | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments'>('overview');
  const [loading, setLoading] = useState(true);

  // Network & Offline States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(offlineCache.getPendingProgressCount());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Video Streaming, Gestures & Watch States
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [watchProgressPercent, setWatchProgressPercent] = useState<number>(0);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);
  const [completionCelebration, setCompletionCelebration] = useState<string | null>(null);

  // Accordion state: map moduleId -> boolean
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // Assignments for this course
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimeoutRef = useRef<any>(null);
  const lastLeftTapRef = useRef<number>(0);
  const lastRightTapRef = useRef<number>(0);

  // Monitor network connectivity & auto-sync progress when reconnected
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await offlineCache.syncProgressQueue();
      setPendingSyncCount(0);
      if (synced > 0) {
        setSyncMessage(`Internet restored: ${synced} progress update(s) synced with server!`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
      if (slug) {
        loadCourseData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [slug]);

  useEffect(() => {
    if (slug) {
      loadCourseData();
    }
  }, [slug]);

  const loadCourseData = async () => {
    if (!slug) return;

    // 1. Instant load from offline cache
    const cached = offlineCache.getCourse(slug);
    if (cached) {
      setCourse(cached);
      const initialOpen: Record<string, boolean> = {};
      cached.modules?.forEach((m) => {
        initialOpen[m.id] = true;
      });
      setOpenModules(initialOpen);

      if (!activeTopic && cached.modules && cached.modules.length > 0) {
        const allT = cached.modules.flatMap((m) => m.topics);
        const found = requestedTopicId
          ? allT.find((t) => t.id === requestedTopicId)
          : allT.find((t) => !t.isCompleted) || allT[0];
        setActiveTopic(found || null);
      }
      setLoading(false);
    }

    // 2. Fetch fresh data from API
    try {
      const courseData = await courseService.getCourseDetail(slug);
      setCourse(courseData);
      offlineCache.saveCourse(slug, courseData);

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
        const allTopics = courseData.modules.flatMap((m) => m.topics);
        topicToSelect = allTopics.find((t) => !t.isCompleted) || allTopics[0] || null;
      }

      if (!activeTopic || requestedTopicId) {
        setActiveTopic(topicToSelect);
      }

      // Load assignments for this course
      const assignData = await assignmentService.getStudentAssignments(courseData.id);
      setAssignments(assignData);
    } catch (err) {
      console.warn('Network course load failed; using cached offline data', err);
      if (!cached) {
        setCourse(null);
      }
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
    setWatchProgressPercent(0);
    setDoubleTapFeedback(null);
    setSearchParams({ topicId: topic.id });
  };

  // Automated completion: ONLY triggers when student completely watches the video
  const completeCurrentTopic = async (topicId?: string) => {
    const targetTopicId = topicId || activeTopic?.id;
    if (!targetTopicId) return;

    // Check if already completed to avoid duplicate requests
    if (activeTopic?.id === targetTopicId && activeTopic.isCompleted) return;

    // Optimistically update local course state
    setCourse((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        modules: prev.modules?.map((m) => ({
          ...m,
          topics: m.topics.map((t) => (t.id === targetTopicId ? { ...t, isCompleted: true } : t)),
        })),
      };
      if (slug) {
        offlineCache.saveCourse(slug, updated);
      }
      return updated;
    });

    if (activeTopic?.id === targetTopicId) {
      setActiveTopic((prev) => (prev ? { ...prev, isCompleted: true } : prev));
    }

    setCompletionCelebration('🎉 Congratulations! You completed this lecture.');
    setTimeout(() => setCompletionCelebration(null), 5000);

    // If offline or network fails, queue to local storage
    if (!navigator.onLine) {
      offlineCache.queueProgress(targetTopicId, true);
      setPendingSyncCount(offlineCache.getPendingProgressCount());
    } else {
      try {
        await curriculumService.updateProgress(targetTopicId, { isCompleted: true });
      } catch (err) {
        console.warn('Online sync failed, queuing for offline retry', err);
        offlineCache.queueProgress(targetTopicId, true);
        setPendingSyncCount(offlineCache.getPendingProgressCount());
      }
    }
  };

  const handleManualSync = async () => {
    const count = await offlineCache.syncProgressQueue();
    setPendingSyncCount(0);
    setSyncMessage(`Synced ${count} items successfully!`);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Video Streaming, Resuming & Progress Handlers
  const handleVideoLoadedMetadata = () => {
    if (activeTopic && videoRef.current) {
      const savedTime = offlineCache.getVideoTime(activeTopic.id);
      if (savedTime > 0 && savedTime < (videoRef.current.duration || 0) - 5) {
        videoRef.current.currentTime = savedTime;
      }
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !activeTopic) return;

    offlineCache.saveVideoTime(activeTopic.id, video.currentTime);

    if (video.duration > 0) {
      const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      setWatchProgressPercent(pct);

      // Only mark completed when completely watched:
      // reached 98% or within 2 seconds of the end
      if (!activeTopic.isCompleted && (pct >= 98 || video.duration - video.currentTime <= 2)) {
        completeCurrentTopic(activeTopic.id);
      }
    }
  };

  const handleVideoEnded = () => {
    if (activeTopic && !activeTopic.isCompleted) {
      completeCurrentTopic(activeTopic.id);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  };

  // Double-tap and double-click skip handling (-10s / +10s)
  const triggerSkip = (seconds: number, side: 'left' | 'right') => {
    skipTime(seconds);
    setDoubleTapFeedback(side);
    setTimeout(() => {
      setDoubleTapFeedback((prev) => (prev === side ? null : prev));
    }, 650);
  };

  // Handles desktop single-click (toggle play/pause) vs double-click (skip 10s)
  const handleSideClick = (side: 'left' | 'right', seconds: number) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      triggerSkip(seconds, side);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play().catch(() => {});
          else videoRef.current.pause();
        }
      }, 240);
    }
  };

  // Touch handlers for mobile double-tap
  const handleLeftTouch = () => {
    const now = Date.now();
    if (now - lastLeftTapRef.current < 350) {
      triggerSkip(-10, 'left');
      lastLeftTapRef.current = 0;
    } else {
      lastLeftTapRef.current = now;
    }
  };

  const handleRightTouch = () => {
    const now = Date.now();
    if (now - lastRightTapRef.current < 350) {
      triggerSkip(10, 'right');
      lastRightTapRef.current = 0;
    } else {
      lastRightTapRef.current = now;
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleNextLesson = () => {
    if (!activeTopic) return;
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
      {/* Lecture Completion Celebration Toast */}
      {completionCelebration && (
        <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <p className="text-xs font-bold">{completionCelebration}</p>
              <p className="text-[11px] text-emerald-100">
                You have finished watching this lecture. Your progress has been updated!
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
        </div>
      )}

      {/* Offline Mode Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Offline Learning Active • ऑफलाइन मोड सुरू आहे</p>
              <p className="text-[11px] text-amber-800">
                तुम्ही ऑफलाइन आहात. आधी लोड झालेले लेक्चर्स, नोट्स व बफर झालेला व्हिडिओ चालू राहील. इंटरनेट आल्यावर प्रोग्रेस आपोआप सेव्ह होईल.
              </p>
            </div>
          </div>
          {pendingSyncCount > 0 && (
            <span className="text-[11px] font-bold px-3 py-1 bg-amber-200/80 text-amber-900 rounded-lg shrink-0 self-start sm:self-auto">
              {pendingSyncCount} update(s) queued
            </span>
          )}
        </div>
      )}

      {/* Sync Success Message Banner */}
      {syncMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-emerald-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{syncMessage}</p>
          </div>
        </div>
      )}

      {/* Pending Sync Manual Trigger if Online */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between text-indigo-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold">
              {pendingSyncCount} offline progress updates ready to sync
            </span>
          </div>
          <button
            onClick={handleManualSync}
            className="text-[11px] font-bold px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Sync Now
          </button>
        </div>
      )}

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
        <div className="lg:col-span-2 space-y-4">
          {/* Video Container with Double-Tap Gestures & Download Protection */}
          <div
            className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl relative border border-slate-800 flex items-center justify-center select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
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
              <>
                <video
                  ref={videoRef}
                  src={offlineCache.optimizeVideoUrl(activeTopic.videoUrl)}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay
                  preload="auto"
                  playsInline
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                  className="w-full h-full object-contain pointer-events-auto select-none"
                />

                {/* Invisible Double-Tap / Double-Click Gesture Touch Zones (Leaves bottom 56px open for video controls) */}
                <div className="absolute inset-x-0 top-0 bottom-14 flex z-10 pointer-events-auto">
                  {/* Left 50% Zone: Double-Click / Double-Tap -> -10s */}
                  <div
                    onClick={() => handleSideClick('left', -10)}
                    onTouchStart={handleLeftTouch}
                    className="w-1/2 h-full relative flex items-center justify-center cursor-pointer select-none"
                    title="Double-tap to rewind 10s"
                  >
                    {doubleTapFeedback === 'left' && (
                      <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-2xl animate-pulse pointer-events-none">
                        <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        <span className="text-xs font-black mt-1 tracking-wider">-10s</span>
                      </div>
                    )}
                  </div>

                  {/* Right 50% Zone: Double-Click / Double-Tap -> +10s */}
                  <div
                    onClick={() => handleSideClick('right', 10)}
                    onTouchStart={handleRightTouch}
                    className="w-1/2 h-full relative flex items-center justify-center cursor-pointer select-none"
                    title="Double-tap to forward 10s"
                  >
                    {doubleTapFeedback === 'right' && (
                      <div className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-2xl animate-pulse pointer-events-none">
                        <RotateCw className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        <span className="text-xs font-black mt-1 tracking-wider">+10s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buffering stream indicator */}
                {isBuffering && (
                  <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] text-white flex items-center space-x-2 pointer-events-none border border-white/10 shadow-lg z-20">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Loading...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Clean Player Toolbar (Skip 10s & Speed controls - Buffer details completely removed) */}
          {!isYouTubeUrl(activeTopic?.videoUrl) && activeTopic?.videoUrl && (
            <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
              <div className="flex items-center space-x-3">
                {/* 10s Skip Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => skipTime(-10)}
                    title="Rewind 10 seconds"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-[11px] font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>-10s</span>
                  </button>
                  <button
                    onClick={() => skipTime(10)}
                    title="Forward 10 seconds"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-[11px] font-semibold"
                  >
                    <span>+10s</span>
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center space-x-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/60">
                  <Gauge className="w-3 h-3 text-slate-400 mr-1" />
                  {[1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => changePlaybackSpeed(spd)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Gesture Hint (Zero buffer stats shown) */}
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <span>💡 Double-tap video sides to skip 10s</span>
              </div>
            </div>
          )}

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

            {/* Automated Completion Status - Students cannot click to mark as completed */}
            {activeTopic && (
              <div>
                {activeTopic.isCompleted ? (
                  <div className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-sm inline-flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Lecture Completed ✓</span>
                  </div>
                ) : activeTopic.videoUrl ? (
                  <div className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Watch full video to complete ({watchProgressPercent}%)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => completeCurrentTopic(activeTopic.id)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Notes Read</span>
                  </button>
                )}
              </div>
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
                              {/* Topic completion indicator (read-only: students cannot click to cheat completion) */}
                              <div
                                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                  topic.isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                    : 'border-slate-300 bg-white'
                                }`}
                                title={topic.isCompleted ? 'Lecture Completed' : 'Watch video completely to complete'}
                              >
                                {topic.isCompleted ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>

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
