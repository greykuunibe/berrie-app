export interface OTPInputProps {
  value?: string[];
  onChange?: (digits: string[]) => void;
  onComplete?: (token: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}
