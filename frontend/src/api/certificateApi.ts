
import api from './axios';

// ==================== TYPES ====================

export interface CertificateEligibility {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  lessonsCompleted: boolean;
  totalQuizzes: number;
  passedQuizzes: number;
  quizzesPassed: boolean;
  eligible: boolean;
  message: string;
}

export interface CertificateCourse {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
}

export interface CertificateStudent {
  id: number;
  name: string;
  email: string;
}

export interface Certificate {
  id: number;
  certificateNumber: string;
  issuedAt: string;
  student?: CertificateStudent;
  course: CertificateCourse;
}

export interface IssueCertificateResponse {
  message: string;
  certificate: Certificate;
}

export interface MyCertificatesResponse {
  totalCertificates: number;
  certificates: Certificate[];
}

// ==================== STUDENT CERTIFICATE APIs ====================

// Check certificate eligibility
export const checkCertificateEligibility = async (
  courseId: number,
): Promise<CertificateEligibility> => {
  const response = await api.get<CertificateEligibility>(
    `/certificates/eligibility/${courseId}`,
  );

  return response.data;
};

// Issue a certificate
export const issueCertificate = async (
  courseId: number,
): Promise<IssueCertificateResponse> => {
  const response = await api.post<IssueCertificateResponse>(
    `/certificates/${courseId}/issue`,
  );

  return response.data;
};

// Get all certificates of logged-in student
export const getMyCertificates = async (): Promise<MyCertificatesResponse> => {
  const response = await api.get<MyCertificatesResponse>(
    '/certificates/my',
  );

  return response.data;
};

// Get certificate for a specific course
export const getCourseCertificate = async (
  courseId: number,
): Promise<Certificate> => {
  const response = await api.get<Certificate>(
    `/certificates/${courseId}`,
  );

  return response.data;
};
