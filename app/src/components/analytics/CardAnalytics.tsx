// src/components/analytics/CardAnalytics.tsx
import { type ComponentChildren } from 'preact';
import './CardAnalytics.css';

interface CardAnalyticsProps {
  title: string;
  value: string | number;
  icon?: ComponentChildren;
  gradient?: 'premium' | 'free';
  subtitle?: string;
}

export function CardAnalytics({ title, value, icon, gradient = 'free', subtitle }: CardAnalyticsProps) {
  return (
    <div class={`gc-card-analytics gc-card-${gradient}`}>
      {icon && <div class="gc-card-analytics-icon">{icon}</div>}
      <div class="gc-card-analytics-content">
        <div class="gc-card-analytics-title">{title}</div>
        <div class="gc-card-analytics-value">{value}</div>
        {subtitle && <div class="gc-card-analytics-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}






