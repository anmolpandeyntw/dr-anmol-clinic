import type { ReactNode } from 'react';
import { Card } from '../common/Card';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {icon && <div className="stat-card__icon">{icon}</div>}
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        {trend && <span className="stat-card__trend">{trend}</span>}
      </div>
    </Card>
  );
}
