import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  actions,
  className = ""
}) => {
  return (
    <div className={`page-container ${className}`}>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            {description && (
              <p className="page-description">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
