export type AuthActionState = {
  error: string | null;
  message: string | null;
};

export const EMPTY_STATE: AuthActionState = {
  error: null,
  message: null,
};
