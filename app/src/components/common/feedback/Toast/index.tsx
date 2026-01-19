import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import './style.css';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export const Toast = ({ message, show, onClose }: ToastProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-fecha após 3 segundos
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div class="toast show">
      {message}
    </div>
  );
};