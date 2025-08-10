import React from 'react';
import { AlertCircle, Search, Plus, FileX, Users, Settings } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'search' | 'file' | 'users' | 'settings' | 'alert' | 'plus';
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'default';
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'file',
  action,
  className = ""
}) => {
  const getIcon = () => {
    const iconProps = { className: "empty-state-icon" };
    
    switch (icon) {
      case 'search':
        return <Search {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'settings':
        return <Settings {...iconProps} />;
      case 'alert':
        return <AlertCircle {...iconProps} />;
      case 'plus':
        return <Plus {...iconProps} />;
      case 'file':
      default:
        return <FileX {...iconProps} />;
    }
  };

  return (
    <div className={`empty-state ${className}`}>
      {getIcon()}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`btn ${action.variant === 'primary' ? 'btn-primary' : 'btn-default'}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
