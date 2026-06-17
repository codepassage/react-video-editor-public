import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { DynamicComposition } from './remotion/DynamicComposition';

// 기본 프로젝트 설정
const defaultProjectSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  backgroundColor: '#000000'
};

const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 동적 컴포지션 - 에디터 및 렌더링용 */}
      <Composition
        id="DynamicComposition"
        component={DynamicComposition}
        durationInFrames={30 * 30} // 30초 @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          tracks: [], // 기본값
          projectSettings: defaultProjectSettings // 기본값
        }}
        // 🔥 에러 방지를 위한 추가 옵션
        calculateMetadata={null}
      />
      
      {/* 다양한 해상도 프리셋 */}
      <Composition
        id="DynamicComposition_HD"
        component={DynamicComposition}
        durationInFrames={30 * 30}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          tracks: [],
          projectSettings: { ...defaultProjectSettings, width: 1280, height: 720 }
        }}
      />
      
      <Composition
        id="DynamicComposition_4K"
        component={DynamicComposition}
        durationInFrames={30 * 30}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{
          tracks: [],
          projectSettings: { ...defaultProjectSettings, width: 3840, height: 2160 }
        }}
      />
      
      {/* 세로형 비디오 (모바일용) */}
      <Composition
        id="DynamicComposition_Vertical"
        component={DynamicComposition}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          tracks: [],
          projectSettings: { ...defaultProjectSettings, width: 1080, height: 1920 }
        }}
      />
      
      {/* 정사각형 비디오 (인스타그램용) */}
      <Composition
        id="DynamicComposition_Square"
        component={DynamicComposition}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          tracks: [],
          projectSettings: { ...defaultProjectSettings, width: 1080, height: 1080 }
        }}
      />
    </>
  );
};

// Remotion registerRoot 방식
registerRoot(RemotionRoot);

// Named export for compatibility
export { RemotionRoot };

// Default export for entry point
export default RemotionRoot;
