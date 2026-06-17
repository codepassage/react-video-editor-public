/**
 * 미디어 처리 유틸리티 함수들
 * LongSentenceEngine에서 분리된 미디어 관련 헬퍼 함수들
 */

import * as path from 'path';

export class MediaUtils {
  /**
   * 미디어 URL에서 타입을 판별
   */
  static getMediaType(mediaUrl: string): 'image' | 'video' {
    const extension = path.extname(mediaUrl).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (videoExtensions.includes(extension)) {
      return 'video';
    } else {
      // 기본값으로 이미지로 처리
      return 'image';
    }
  }

  /**
   * 미디어 속성을 클립에 적용
   */
  static applyMediaProperties(mediaProperties: any) {
    if (!mediaProperties) {
      return {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        opacity: 1.0,
        rotation: 0,
      };
    }

    console.log('🔍 MediaUtils.applyMediaProperties 입력:', mediaProperties);

    const result = {
      x: mediaProperties.x !== undefined ? mediaProperties.x : 0,
      y: mediaProperties.y !== undefined ? mediaProperties.y : 0,
      width: mediaProperties.width !== undefined ? mediaProperties.width : 1920,
      height: mediaProperties.height !== undefined ? mediaProperties.height : 1080,
      opacity: mediaProperties.opacity !== undefined ? mediaProperties.opacity : 1.0,
      rotation: mediaProperties.rotation !== undefined ? mediaProperties.rotation : 0,
      
      // 이미지 효과
      ...(mediaProperties.filters && { filters: mediaProperties.filters }),
      ...(mediaProperties.effects && { effects: mediaProperties.effects }),
      ...(mediaProperties.crop && { crop: mediaProperties.crop }),
    };

    console.log('🔍 MediaUtils.applyMediaProperties 결과:', result);
    return result;
  }
}