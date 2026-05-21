import styles from './ConfidenceBadge.module.css';

interface ConfidenceBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

const BADGE_CONFIG = {
  HIGH: { icon: '✓', label: 'Alta Confiança', className: 'high' },
  MEDIUM: { icon: '~', label: 'Média Confiança', className: 'medium' },
  LOW: { icon: '⚠', label: 'Baixa Confiança', className: 'low' },
} as const;

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const config = BADGE_CONFIG[level] || BADGE_CONFIG.LOW;

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      <span className={styles.icon}>{config.icon}</span>
      {config.label}
    </span>
  );
}
