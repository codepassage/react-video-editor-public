import React from 'react';
import { useDrag } from 'react-dnd';
import { Image, Video, Music, Type, Trash2, FileIcon, HardDrive, Shapes } from 'lucide-react';
import { useEditorStore } from '../../../store/editorStore';
import { MediaItem, MediaType } from '../../../types';
import { apiClient, fileUtils } from '../../../api/client';

interface MediaLibraryItemProps {
  item: MediaItem;
  onDelete?: () => void;
  onAddToLocal?: () => void;
  onAddToTimeline?: (item: MediaItem) => void;
  isServerItem?: boolean;
}

export const MediaLibraryItem: React.FC<MediaLibraryItemProps> = ({ 
  item, 
  onDelete, 
  onAddToLocal, 
  onAddToTimeline,
  isServerItem 
}) => {
  const { openMediaItemPropertiesPanel } = useEditorStore();

  // 미디어 타입별 아이콘 및 색상 결정
  const getMediaTypeInfo = (mediaType: MediaType) => {
    const typeInfo = {
      image: {
        icon: <Image size={20} style={{ color: '#4caf50' }} />,
        color: '#4caf50'
      },
      video: {
        icon: <Video size={20} style={{ color: '#2196f3' }} />,
        color: '#2196f3'
      },
      audio: {
        icon: <Music size={20} style={{ color: '#9c27b0' }} />,
        color: '#9c27b0'
      },
      text: {
        icon: <Type size={20} style={{ color: '#ff9800' }} />,
        color: '#ff9800'
      },
      shape: {
        icon: <Shapes size={20} style={{ color: '#e91e63' }} />,
        color: '#e91e63'
      },
      simpleShape: {
        icon: <span style={{ fontSize: '20px', color: '#673ab7' }}>🧪</span>,
        color: '#673ab7'
      },
      polygonShape: {
        icon: <span style={{ fontSize: '20px', color: '#009688' }}>🔷</span>,
        color: '#009688'
      }
    };

    return typeInfo[mediaType] || {
      icon: <FileIcon size={20} style={{ color: '#757575' }} />,
      color: '#757575'
    };
  };

  const [{ isDragging }, drag] = useDrag({
    type: 'media',
    item: { type: 'media', mediaItem: item },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 미디어 아이템 클릭 핸들러
  const handleMediaItemClick = (e: React.MouseEvent) => {
    // 삭제 버튼 클릭은 무시
    if (e.target !== e.currentTarget && (e.target as Element).closest('button')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Shift+클릭이면 속성 패널 열기
    if (e.shiftKey) {
      openMediaItemPropertiesPanel(item.id);
      return;
    }
    
    // 일반 클릭이면 타임라인에 추가
    if (onAddToTimeline) {
      onAddToTimeline(item);
      return;
    }
  };

  // 아이콘 가져오기
  const getIcon = () => {
    return getMediaTypeInfo(item.type).icon;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return fileUtils.formatFileSize(bytes);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={drag}
      onClick={handleMediaItemClick}
      style={{
        padding: '16px',
        background: isDragging
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        borderRadius: '12px',
        cursor: isDragging ? 'move' : 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        transform: isDragging ? 'scale(0.95) rotate(2deg)' : 'scale(1) rotate(0deg)',
        opacity: isDragging ? 0.7 : 1,
        position: 'relative',
        overflow: 'hidden'
      }}
      title="클릭: 타임라인에 추가, Shift+클릭: 속성 편집, 드래그: 타임라인에 추가"
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(100, 181, 246, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(100, 181, 246, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          {/* 썸네일 또는 아이콘 */}
          <div style={{ flexShrink: 0 }}>
            {item.thumbnail ? (
              <img
                src={apiClient.resolveUrl(item.thumbnail)}
                alt={item.name}
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {getIcon()}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 8px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }} title={item.name}>
              {item.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getMediaTypeInfo(item.type).color
                }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {item.type}
                </span>
                {isServerItem && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: 'rgba(33, 150, 243, 0.2)',
                    borderRadius: '4px',
                    color: '#64b5f6',
                    fontWeight: '500'
                  }}>
                    서버
                  </span>
                )}
              </div>

              {item.width && item.height && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {item.width} × {item.height}
                </div>
              )}
              {item.duration && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {formatDuration(item.duration)}
                </div>
              )}
              {item.fileSize && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {formatFileSize(item.fileSize)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {/* 서버 아이템일 경우 로컬에 추가 버튼 */}
          {onAddToLocal && (
            <button
              onClick={onAddToLocal}
              style={{
                padding: '8px',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(129, 199, 132, 0.8) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.4)',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 0.7,
                flexShrink: 0
              }}
              title="로컬 미디어에 추가"
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <HardDrive size={16} />
            </button>
          )}

          {/* 삭제 버튼 (로컬 아이템만) */}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: '8px',
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(229, 115, 115, 0.8) 100%)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 0.7,
                flexShrink: 0
              }}
              title="삭제"
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};