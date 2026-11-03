import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import {
  GraduationCap,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Login: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 60-second countdown timer for Resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevOtpHint(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setError('Please enter your student email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(cleanEmail);
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setStep('otp');
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No account found with this email. Please contact your instructor/admin to get enrolled.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authService.verifyOtp(email.toLowerCase().trim(), cleanOtp);
      login(user, token);

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Invalid or expired verification code. Please check your email or request a new code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Alternative Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await authService.loginWithPassword(email.toLowerCase().trim(), password);
      login(user, token);

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 ring-1 ring-white/20">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">DreamsGuider</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {step === 'otp'
            ? 'Enter the 6-digit code sent to your email'
            : 'Student Learning Portal — Sign in to access your allocated courses'}
        </p>
      </div>

      {/* Main Form Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">
          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success / OTP Sent Alert */}
          {successMsg && step === 'otp' && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Development OTP Quick-Fill Badge */}
          {devOtpHint && step === 'otp' && (
            <div className="mb-4 p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between text-indigo-300 text-xs">
              <span>Demo OTP: <strong>{devOtpHint}</strong></span>
              <button
                type="button"
                onClick={() => setOtp(devOtpHint)}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold"
              >
                Auto Fill
              </button>
            </div>
          )}

          {/* STEP 1: Email Input for OTP Request */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@domain.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>A secure 6-digit login OTP will be sent to this email.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('password');
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Or sign in with password →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Enter 6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setStep('email');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change email</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="• • • • • •"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xl text-center font-mono font-bold tracking-[0.4em] text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-400">
                    To: <strong className="text-slate-300">{email}</strong>
                  </span>
                  {countdown > 0 ? (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full mt-3 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Classroom</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('password');
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Sign in with password instead →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 (Optional Fallback): Password Login */}
          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@domain.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In With Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('email');
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center space-x-1 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Switch back to Email OTP Login</span>
                </button>
              </div>
            </form>
          )}

          {/* Student Access Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Accounts are allocated by academy instructors only.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
