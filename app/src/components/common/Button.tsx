import { h } from 'preact';
import './Button.css';

interface ButtonProps extends h.JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button class={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}
