export interface ITutorData {
  bio: string;
  hourlyRate: number;
  experienceYrs: number;
  location?: string;
  languages?: string;
  profileImage?: string;
  institution?: string;
  categories?: string[];
}

export interface ICreateTutorPayload {
  email: string;
  password: string;
  name: string;
  tutor: ITutorData;
}

export interface ITutorRequest {
  bio: string;
  hourlyRate: number;
  experienceYrs: number;
  location?: string;
  languages?: string;
  institution?: string;
  categories?: string[];
}

export interface IUpdateTutor {
  bio?: string;
  hourlyRate?: number;
  experienceYrs?: number;
  location?: string;
  languages?: string;
  profileImage?: string;
  institution?: string;
  categories?: string[];
}

export interface ITutorApprovalPayload {
  requestId: string;
}

export interface ITutorRejectionPayload {
  requestId: string;
  rejectionReason: string;
}
