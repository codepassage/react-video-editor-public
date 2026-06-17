/**
 * 클립 처리 유틸리티 함수들
 * NestedEngine에서 분리된 클립 관련 헬퍼 함수들
 */

export class ClipUtils {
  /**
   * 전달된 baseId를 기반으로 전역적으로 유일한 ID 반환
   */
  static generateUniqueId(baseId: string, counter: number): string {
    return `${baseId}_${counter}`;
  }

  /**
   * 클립과 종속 클립들의 ID를 재귀적으로 수집
   */
  static collectClipAndDependentIds(clip: any): string[] {
    const ids: string[] = [];

    // 기본 클립 id 추가
    if (clip?.id) {
      ids.push(clip.id);
    }

    // 종속 클립 id 추출
    if (Array.isArray(clip?.dependentClips)) {
      ids.push(...clip.dependentClips.map((d: any) => d.id));
    }

    // 하위(중첩) 클립 재귀 처리
    if (Array.isArray(clip?.clips)) {
      for (const nestedClip of clip.clips) {
        ids.push(...this.collectClipAndDependentIds(nestedClip));
      }
    }

    return ids;
  }

  /**
   * 원래 컨테이너의 템플릿 길이 계산
   */
  static calculateOriginalContainerDuration(containerClip: any): number {
    if (!containerClip.clips || containerClip.clips.length === 0) {
      return containerClip.duration || (containerClip.endTime - containerClip.startTime) || 0;
    }

    // 컨테이너 내부 클립들의 시간 범위로 계산
    const startTimes = containerClip.clips.map((c: any) => c.startTime || 0);
    const endTimes = containerClip.clips.map((c: any) => c.endTime || c.startTime + c.duration || 0);

    if (startTimes.length === 0 || endTimes.length === 0) return 0;

    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    return maxEnd - minStart;
  }

  /**
   * 클립에서 사용된 폰트를 수집 (폰트 로딩 문제 해결용)
   */
  static collectFontsFromClip(clip: any, usedFonts: Set<string>): void {
    if (!clip) return;

    // Sentence 클립의 폰트 수집
    if (clip.mediaType === 'sentence' && clip.fontFamily) {
      usedFonts.add(clip.fontFamily);
      console.log(`🔤 폰트 수집: ${clip.fontFamily} (Sentence 클립: ${clip.name || clip.id})`);
    }

    // LongSentence 확장 클립들에서 폰트 수집
    if (clip.__expandedClips && Array.isArray(clip.__expandedClips)) {
      clip.__expandedClips.forEach((expandedClip: any) => {
        this.collectFontsFromClip(expandedClip, usedFonts);
      });
    }
  }

  /**
   * 수집된 폰트들을 위한 더미 text 클립들을 생성
   */
  static createDummyTextClipsForFonts(usedFonts: Set<string>): any[] {
    const dummyClips: any[] = [];

    for (const fontFamily of usedFonts) {
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const mediaId = `text-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const dummyClip = {
        id: clipId,
        mediaId: mediaId,
        trackId: "track-1000",
        startTime: 0,
        endTime: 0.5,
        duration: 0.5,
        mediaType: "text",
        x: 3000,  // 화면 크기보다 큰 값으로 화면 밖에 배치
        y: 3000,  // 화면 크기보다 큰 값으로 화면 밖에 배치
        width: 1,
        height: 1,
        opacity: 0,  // 완전 투명
        text: "dummy",
        fontSize: 1,
        fontFamily: fontFamily
      };

      dummyClips.push(dummyClip);
      console.log(`🔤 더미 텍스트 클립 생성: ${fontFamily} (ID: ${clipId})`);
    }

    if (dummyClips.length > 0) {
      console.log(`✅ 총 ${dummyClips.length}개 폰트용 더미 클립 생성 완료`);
    }

    return dummyClips;
  }
}