export interface AuthRequest {
  userId: string;
  role: string;
}

export interface AuthResponse {
  token: string;
}

export interface CommandRequest {
  command: string;
}

export interface ToolParams {
  action: string;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  status: number;
}