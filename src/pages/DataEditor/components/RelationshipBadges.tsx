import React from 'react';
import { FileJson, Database, AlertCircle, Link } from 'lucide-react';
import './RelationshipStyles.css';

interface RelationshipBadgesProps {
  resourceData: any;
  compact?: boolean;
  showManageButton?: boolean;
  onManageClick?: () => void;
}

export const RelationshipBadges: React.FC<RelationshipBadgesProps> = ({
  resourceData,
  compact = false,
  showManageButton = false,
  onManageClick
}) => {
  const hasTemplate = resourceData.resourceTemplate;
  const hasCsvMap = resourceData.csvColumnMap;
  const isComplete = hasTemplate && hasCsvMap;

  return (
    <div className={`relationship-badges ${compact ? 'compact' : ''}`}>
      {hasTemplate && (
        <span className="badge template">
          <FileJson size={12} />
          <span className="badge-text">
            {compact ? 'T' : `템플릿: ${resourceData.resourceTemplate.name}`}
          </span>
        </span>
      )}
      
      {hasCsvMap && (
        <span className="badge csv-map">
          <Database size={12} />
          <span className="badge-text">
            {compact ? 'C' : `CSV: ${resourceData.csvColumnMap.name}`}
          </span>
        </span>
      )}
      
      {!isComplete && (
        <span className="badge incomplete">
          <AlertCircle size={12} />
          <span className="badge-text">
            {compact ? '!' : '설정 필요'}
          </span>
        </span>
      )}

      {showManageButton && onManageClick && (
        <button
          className="manage-relationships-btn"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onManageClick();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          title="관계 관리"
        >
          <Link size={14} />
        </button>
      )}
    </div>
  );
};