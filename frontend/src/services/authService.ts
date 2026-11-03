import api from './api';
import { User } from '../types';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    devOtp?: string;
  };
}

export interface VerifyOtpResponse {
  user: User;
  token: string;
}

export const authService = {
  sendOtp: async (email: string): Promise<SendOtpResponse> => {
    const res = await api.post<SendOtpResponse>('/auth/send-otp', { email });
    return res.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data.data;
  },

  loginWithPassword: async (email: string, password: string): Promise<VerifyOtpResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },
};
