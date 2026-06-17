import React from 'react';
import { X } from 'lucide-react';
import './RelationshipStyles.css';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  autoHeight?: boolean;
  contentPadding?: 'none' | 'normal' | 'wide';
  className?: string;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  autoHeight = false,
  contentPadding = 'none',
  className = ''
}) => {
  if (!isOpen) return null;

  const getSizeClass = () => {
    const classes = [];
    
    switch (size) {
      case 'small':
        classes.push('modal-small');
        break;
      case 'large':
        classes.push('modal-large');
        break;
    }
    
    if (autoHeight) {
      classes.push('modal-auto-height');
    }
    
    return classes.join(' ');
  };

  const getContentPaddingClass = () => {
    switch (contentPadding) {
      case 'none':
        return '';
      case 'wide':
        return 'modal-content-wide';
      default:
        return 'modal-content-padded';
    }
  };

  return (
    <div className="relationship-manager-modal-overlay">
      <div className={`relationship-manager-modal ${getSizeClass()} ${className}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={`modal-content ${getContentPaddingClass()}`}>
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};