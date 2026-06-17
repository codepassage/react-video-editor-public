/**
 * Property utility functions for copying text and visual properties
 * Extracted from longSentenceEngine.ts for better modularity
 */

export class PropertyUtils {
  /**
   * 🔥 longSentence 클립의 모든 텍스트 속성을 완전히 복사 (텍스트 전용)
   */
  static copyAllTextProperties(longSentenceClip: any): any {
    const textProps = longSentenceClip.textProperties || {};

    console.log('🔍 copyAllTextProperties 호출:', {
      clipId: longSentenceClip.id?.slice(-8),
      textProperties: textProps,
      hasEffects: !!(textProps.brightness || textProps.contrast || textProps.saturation),
      // 🔧 패딩 및 배경 속성 디버깅
      패딩속성들: {
        paddingTop: longSentenceClip.paddingTop || textProps.paddingTop,
        paddingRight: longSentenceClip.paddingRight || textProps.paddingRight,
        paddingBottom: longSentenceClip.paddingBottom || textProps.paddingBottom,
        paddingLeft: longSentenceClip.paddingLeft || textProps.paddingLeft,
      },
      배경속성: {
        backgroundColor: longSentenceClip.backgroundColor,
        isGradient: longSentenceClip.backgroundColor?.includes('gradient')
      }
    });

    return {
      // 📝 텍스트 전용 좌표와 사이즈 (textProperties에서만 가져오기)
      x: textProps.x !== undefined ? textProps.x : 0,
      y: textProps.y !== undefined ? textProps.y : 0,
      width: textProps.width !== undefined ? textProps.width : 1920,
      height: textProps.height !== undefined ? textProps.height : 100,
      opacity: textProps.opacity !== undefined ? textProps.opacity : 1.0,
      rotation: textProps.rotation !== undefined ? textProps.rotation : 0,

      // 📝 텍스트 스타일링
      fontSize: textProps.fontSize !== undefined ? textProps.fontSize : 24,
      color: textProps.color !== undefined ? textProps.color : '#ffffff',
      backgroundColor: textProps.backgroundColor !== undefined ? textProps.backgroundColor : 'transparent',
      borderRadius: textProps.borderRadius,
      borderRadiusUnit: textProps.borderRadiusUnit,

      // ✨ Effects
      brightness: textProps.brightness !== undefined ? textProps.brightness : 100,
      contrast: textProps.contrast !== undefined ? textProps.contrast : 100,
      saturation: textProps.saturation !== undefined ? textProps.saturation : 100,
      hue: textProps.hue !== undefined ? textProps.hue : 0,
      blur: textProps.blur !== undefined ? textProps.blur : 0,
      sepia: textProps.sepia !== undefined ? textProps.sepia : 0,
      grayscale: textProps.grayscale !== undefined ? textProps.grayscale : 0,

      // 🌅 Fade effects
      fadeIn: textProps.fadeIn !== undefined ? textProps.fadeIn : 0,
      fadeOut: textProps.fadeOut !== undefined ? textProps.fadeOut : 0,

      // 🎬 Animation
      animationType: textProps.animationType,
      animationDuration: textProps.animationDuration !== undefined ? textProps.animationDuration : 1,
      animationDelay: textProps.animationDelay !== undefined ? textProps.animationDelay : 0,
      animationEasing: textProps.animationEasing !== undefined ? textProps.animationEasing : 'ease',
      animationLoop: textProps.animationLoop !== undefined ? textProps.animationLoop : false,

      // 🎨 Text styling
      textShadow: textProps.textShadow,
      textShadowColor: textProps.textShadowColor,
      textShadowOffsetX: textProps.textShadowOffsetX,
      textShadowOffsetY: textProps.textShadowOffsetY,
      textShadowBlur: textProps.textShadowBlur,

      // 📐 Padding
      paddingTop: longSentenceClip.paddingTop || textProps.paddingTop,
      paddingRight: longSentenceClip.paddingRight || textProps.paddingRight,
      paddingBottom: longSentenceClip.paddingBottom || textProps.paddingBottom,
      paddingLeft: longSentenceClip.paddingLeft || textProps.paddingLeft,
    };
  }

  /**
   * 🔥 longSentence 클립의 모든 시각적 속성을 완전히 복사 (미디어 전용)
   */
  static copyAllVisualProperties(longSentenceClip: any): any {
    const mediaProps = longSentenceClip.mediaProperties || {};

    console.log('📊 copyAllVisualProperties 호출:', {
      clipId: longSentenceClip.id?.slice(-8),
      mediaProperties: mediaProps,
      hasEffects: !!(mediaProps.brightness || mediaProps.contrast || mediaProps.saturation),
      longSentenceClip_x: longSentenceClip.x,
      longSentenceClip_y: longSentenceClip.y,
      longSentenceClip_width: longSentenceClip.width,
      longSentenceClip_height: longSentenceClip.height,
      mediaProps_x: mediaProps.x,
      mediaProps_y: mediaProps.y,
      mediaProps_width: mediaProps.width,
      mediaProps_height: mediaProps.height,
      전체mediaProperties: mediaProps
    });

    return {
      // 📝 미디어 전용 좌표와 사이즈 (mediaProperties 우선)
      x: mediaProps.x !== undefined ? mediaProps.x : 0,
      y: mediaProps.y !== undefined ? mediaProps.y : 0,
      width: mediaProps.width !== undefined ? mediaProps.width : 1920,
      height: mediaProps.height !== undefined ? mediaProps.height : 1080,
      opacity: mediaProps.opacity !== undefined ? mediaProps.opacity : 1.0,
      rotation: mediaProps.rotation !== undefined ? mediaProps.rotation : 0,

      // ✨ Effects (mediaProperties 우선으로 처리)
      brightness: mediaProps.brightness !== undefined ? mediaProps.brightness : 100,
      contrast: mediaProps.contrast !== undefined ? mediaProps.contrast : 100,
      saturation: mediaProps.saturation !== undefined ? mediaProps.saturation : 100,
      hue: mediaProps.hue !== undefined ? mediaProps.hue : 0,
      blur: mediaProps.blur !== undefined ? mediaProps.blur : 0,
      sepia: mediaProps.sepia !== undefined ? mediaProps.sepia : 0,
      grayscale: mediaProps.grayscale !== undefined ? mediaProps.grayscale : 0,

      // 🌅 Fade effects
      fadeIn: mediaProps.fadeIn !== undefined ? mediaProps.fadeIn : 0,
      fadeOut: mediaProps.fadeOut !== undefined ? mediaProps.fadeOut : 0,

      // 🎬 Animation
      animationType: mediaProps.animationType,
      animationDuration: mediaProps.animationDuration !== undefined ? mediaProps.animationDuration : 1,
      animationDelay: mediaProps.animationDelay !== undefined ? mediaProps.animationDelay : 0,
      animationEasing: mediaProps.animationEasing !== undefined ? mediaProps.animationEasing : 'ease',
      animationLoop: mediaProps.animationLoop !== undefined ? mediaProps.animationLoop : false,

      // 🖼️ Background and fit
      backgroundFit: mediaProps.backgroundFit !== undefined ? mediaProps.backgroundFit : 'cover',
      borderColor: mediaProps.borderColor,
      borderWidth: mediaProps.borderWidth,

      // 🌟 Shadow effects
      shadowEnabled: mediaProps.shadowEnabled,
      shadowColor: mediaProps.shadowColor,
      shadowOffsetX: mediaProps.shadowOffsetX,
      shadowOffsetY: mediaProps.shadowOffsetY,
      shadowBlur: mediaProps.shadowBlur,
    };
  }
}