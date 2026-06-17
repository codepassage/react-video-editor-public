import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { RenderComposition } from './RenderComposition';
import type { RenderCompositionProps } from './types';

// 🎬 렌더링 전용 컴포지션 래퍼 (getInputProps 사용)
export default function RenderCompositionWrapper() {
  // 🔥 렌더링 환경에서만 getInputProps() 사용
  const inputProps = getInputProps() as RenderCompositionProps;
  
  console.log('🎯 Render Input Props (렌더링 환경):', {
    hasTimelineData: !!inputProps?.timelineData,
    timelineDataLength: inputProps?.timelineData?.length || 0,
    durationInFrames: inputProps?.durationInFrames,
    compositionWidth: inputProps?.compositionWidth,
    compositionHeight: inputProps?.compositionHeight,
    isRendering: inputProps?.isRendering,
  });
  
  return (
    <Composition
      id="VideoEditorComposition"
      component={RenderComposition}
      durationInFrames={inputProps?.durationInFrames || 300}
      fps={30}
      width={inputProps?.compositionWidth || 1920}
      height={inputProps?.compositionHeight || 1080}
      defaultProps={{
        timelineData: inputProps?.timelineData || [
          {
            id: "default",
            totalDuration: 10,
            scrubbers: [
              { 
                id: "default-text", 
                startTime: 0, 
                endTime: 10, 
                duration: 10, 
                mediaType: "text" as const, 
                width: 800, 
                height: 200,
                trackId: "default", 
                trackIndex: 0, 
                media_width: 800, 
                media_height: 200,
                x: 560,
                y: 440,
                text: "Default Test Text",
                fontSize: 48,
                color: "#ffffff",
                backgroundColor: "rgba(0,0,0,0.5)",
                textAlign: "center" as const,
                opacity: 1,
              },
            ],
          }
        ],
        isRendering: inputProps?.isRendering !== false // 렌더링 환경에서는 기본적으로 true
      }}
    />
  );
}
