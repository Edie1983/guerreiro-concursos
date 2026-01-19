import { h, ComponentChildren } from 'preact';
import '../../styles/layout.css';

interface PublicLayoutProps {
  children: ComponentChildren;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div class="gc-public-layout">
      <div class="gc-public-content">
        {children}
      </div>
    </div>
  );
};
