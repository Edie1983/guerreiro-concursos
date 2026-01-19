import { h, ComponentChildren } from 'preact';

interface CardProps {
  children: ComponentChildren;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div class={`premium-card ${className}`}>
      {children}
    </div>
  );
};
