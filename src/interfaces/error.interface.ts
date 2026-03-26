export interface TErrorSources {
  path?: string; // optional now
  message: string;
  value?: unknown; // optional invalid value
}

export interface TErrorResponse {
  statusCode?: number;
  success: boolean;
  message: string;
  errorSources: TErrorSources[];
  stack?: string; // optional
  error?: unknown;
  metadata?: Record<string, any> | undefined; // allow undefined
}
