import { h, ComponentChildren } from 'preact';

interface PageWrapperProps {
  children: ComponentChildren;
  title?: string;
  subtitle?: string;
  rightSlot?: ComponentChildren;
}

export const PageWrapper = ({ children, title, subtitle, rightSlot }: PageWrapperProps) => {
  return (
    <div class="gc-page-wrapper">
      {(title || rightSlot) && (
        <div class="gc-page-header">
          <div>
            {title && <h1 class="gc-page-title">{title}</h1>}
            {subtitle && <p class="gc-page-subtitle">{subtitle}</p>}
          </div>
          {rightSlot && <div>{rightSlot}</div>}
        </div>
      )}
      <main>
        {children}
      </main>
    </div>
  );
};
