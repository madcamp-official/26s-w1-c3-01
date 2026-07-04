export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string | null;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
