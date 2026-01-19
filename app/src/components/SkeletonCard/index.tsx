import { h } from 'preact';
import './style.css';

export const SkeletonCard = () => (
  <div class="skeleton-card">
    <div class="skeleton-line skeleton-title" />
    <div class="skeleton-line skeleton-text" />
    <div class="skeleton-line skeleton-text short" />
    <div class="skeleton-badge" />
  </div>
);