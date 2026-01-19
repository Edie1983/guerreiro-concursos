import { h } from 'preact';
import './Input.css';

interface InputProps extends h.JSX.HTMLAttributes<HTMLInputElement> {
  label: string;
  type?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div class="form-group">
      <label>{label}</label>
      <input class="input-field" {...props} />
    </div>
  );
}
