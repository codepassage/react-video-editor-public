/**
 * ContainerTimeOffsetManager
 * 기준 클립 + 컨테이너 확장 시간을 모두 고려한 오프셋 관리자
 * 
 * 핵심 개념:
 * 1. 기준 클립의 길이 변화 (동적 길이)
 * 2. 컨테이너 확장으로 생성된 클립들의 실제 점유 시간
 * 3. 중첩 컨테이너 처리를 위한 스택 관리
 */
export class ContainerTimeOffsetManager {
  // 현재 전역 시간 오프셋 (기준 클립 변화 + 컨테이너 확장 누적)
  private currentOffset: number = 0;
  
  // 중첩 컨테이너용 스택
  private offsetStack: number[] = [];
  
  // 디버깅용
  private enableDebug: boolean;
  private debugLogs: string[] = [];
  
  // 시간 추적 상세 정보
  private timeTrackingDetails: Array<{
    type: 'base_clip_delta' | 'container_expansion';
    source: string;
    timeChange: number;
    beforeOffset: number;
    afterOffset: number;
    timestamp: number;
  }> = [];

  constructor(enableDebug: boolean = false) {
    this.enableDebug = enableDebug;
    this.log('TimeOffsetManager 초기화됨 - 컨테이너 확장 시간 포함');
  }

  /**
   * 현재 전역 오프셋 조회 (모든 클립이 이 값을 적용받음)
   */
  getCurrentOffset(): number {
    return this.currentOffset;
  }

  /**
   * 기준 클립의 길이 변화를 전역 오프셋에 누적
   * 예: TTS 오디오 클립의 실제 길이가 템플릿과 다를 때
   */
  addBaseClipDelta(durationDelta: number, baseClipId: string): void {
    if (durationDelta === 0) return;
    
    const beforeOffset = this.currentOffset;
    this.currentOffset += durationDelta;
    
    this.timeTrackingDetails.push({
      type: 'base_clip_delta',
      source: baseClipId,
      timeChange: durationDelta,
      beforeOffset,
      afterOffset: this.currentOffset,
      timestamp: Date.now()
    });
    
    this.log(`기준 클립 길이 변화: ${baseClipId}, Delta: ${durationDelta}초, ${beforeOffset} → ${this.currentOffset}`);
  }

  /**
   * 🆕 컨테이너 확장으로 인한 실제 점유 시간 누적
   * 
   * 예: template-inner-middle이 3회 반복되어 
   * 원래 2초 구간이 실제로는 6초를 차지하게 될 때
   * expansionTime = 4초 (6초 - 2초)
   */
  addContainerExpansionTime(expansionTime: number, containerId: string): void {
    if (expansionTime === 0) return;
    
    const beforeOffset = this.currentOffset;
    this.currentOffset += expansionTime;
    
    this.timeTrackingDetails.push({
      type: 'container_expansion',
      source: containerId,
      timeChange: expansionTime,
      beforeOffset,
      afterOffset: this.currentOffset,
      timestamp: Date.now()
    });
    
    this.log(`컨테이너 확장 시간 누적: ${containerId}, 확장시간: ${expansionTime}초, ${beforeOffset} → ${this.currentOffset}`);
  }

  /**
   * 컨테이너 확장 시간 계산 헬퍼
   * 
   * @param originalDuration 템플릿에서의 원래 컨테이너 길이
   * @param actualDuration 반복 확장 후 실제 점유하는 길이
   * @returns 추가로 점유하는 시간
   */
  calculateContainerExpansionTime(originalDuration: number, actualDuration: number): number {
    const expansionTime = actualDuration - originalDuration;
    this.log(`컨테이너 확장 시간 계산: 원래(${originalDuration}) → 실제(${actualDuration}) = 확장(${expansionTime})`);
    return Math.max(0, expansionTime); // 음수는 0으로 처리
  }

  /**
   * 중첩 컨테이너 진입 (새로운 시간 컨텍스트 시작)
   */
  pushContainerContext(instanceStartOffset: number, containerId: string): void {
    this.offsetStack.push(this.currentOffset);
    this.currentOffset = instanceStartOffset;
    
    this.log(`컨테이너 진입: ${containerId}, 스택 저장: ${this.offsetStack[this.offsetStack.length - 1]}, 새 오프셋: ${instanceStartOffset}`);
  }

  /**
   * 중첩 컨테이너 복귀 (이전 시간 컨텍스트로 복원)
   */
  popContainerContext(containerId: string): void {
    if (this.offsetStack.length > 0) {
      const restoredOffset = this.offsetStack.pop()!;
      this.currentOffset = restoredOffset;
      
      this.log(`컨테이너 복귀: ${containerId}, 복원된 오프셋: ${restoredOffset}`);
    } else {
      this.log(`컨테이너 복귀 실패: ${containerId} - 스택이 비어있음`);
    }
  }

  /**
   * 컨테이너 인스턴스의 시작 위치 계산
   * 부모 오프셋 + 이전 인스턴스들의 누적 길이
   */
  calculateInstanceStartOffset(parentOffset: number, cumulativeDuration: number): number {
    return parentOffset + cumulativeDuration;
  }

  /**
   * 모든 상태 초기화
   */
  reset(): void {
    this.currentOffset = 0;
    this.offsetStack = [];
    this.debugLogs = [];
    this.timeTrackingDetails = [];
    this.log('TimeOffsetManager 초기화됨');
  }

  /**
   * 디버그 모드 설정/해제
   */
  setDebugMode(enable: boolean): void {
    this.enableDebug = enable;
    this.log(`디버그 모드 ${enable ? '활성화' : '비활성화'}됨`);
  }

  /**
   * 현재 디버그 모드 상태 조회
   */
  isDebugMode(): boolean {
    return this.enableDebug;
  }

  /**
   * 디버그 로그 기록
   */
  private log(message: string): void {
    if (this.enableDebug) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      this.debugLogs.push(logMessage);
      console.log(`[TimeOffsetManager] ${message}`);
    }
  }

  /**
   * 상세 진단 정보 반환
   */
  getDiagnostics() {
    return {
      currentOffset: this.currentOffset,
      stackDepth: this.offsetStack.length,
      stackContents: [...this.offsetStack],
      timeTrackingDetails: this.timeTrackingDetails,
      summary: {
        totalBaseClipDeltas: this.timeTrackingDetails
          .filter(d => d.type === 'base_clip_delta')
          .reduce((sum, d) => sum + d.timeChange, 0),
        totalContainerExpansions: this.timeTrackingDetails
          .filter(d => d.type === 'container_expansion')
          .reduce((sum, d) => sum + d.timeChange, 0)
      },
      logs: this.debugLogs.slice(-10) // 최근 10개만
    };
  }
}