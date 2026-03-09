export type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

export type TicketInputProps = {
  className?: string;
  onSuccess?: () => void;
  autoFillForm?: boolean;
};

export type StatusIconProps = {
  status: ValidationStatus;
};

export type InputFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
  placeholder: string;
  disabled: boolean;
  status: ValidationStatus;
};

export type SubmitButtonProps = {
  onClick: (e?: React.FormEvent) => void;
  disabled: boolean;
  isChecking: boolean;
};

export type ErrorMessageProps = {
  message: string;
};

export type SuccessMessageProps = {
  message: string;
};