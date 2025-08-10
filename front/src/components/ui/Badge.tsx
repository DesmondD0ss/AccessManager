import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  showIcon = false,
  className = ""
}) => {
  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconProps = { className: "w-3 h-3 mr-1" };
    
    switch (variant) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      case 'md':
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'error':
        return 'badge-error';
      case 'info':
        return 'badge-info';
      case 'default':
      default:
        return 'badge-default';
    }
  };

  return (
    <span className={`badge ${getVariantClasses()} ${getSizeClasses()} ${className}`}>
      {getIcon()}
      {children}
    </span>
  );
};

export default Badge;
