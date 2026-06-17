/**
 * Whisper 서비스 팩토리
 * 환경 설정에 따라 적절한 Whisper 구현체를 선택하여 반환
 */

import { WhisperProvider } from './base/WhisperProvider';
import { OpenAIWhisperProvider } from './providers/OpenAIWhisperProvider';
import { LocalWhisperProvider } from './providers/LocalWhisperProvider';
import { RemoteWhisperProvider } from './providers/RemoteWhisperProvider';

export type WhisperProviderType = 'openai' | 'local' | 'remote' | 'auto';

export class WhisperServiceFactory {
  private static instance: WhisperProvider | null = null;
  private static currentProviderType: WhisperProviderType | null = null;

  /**
   * 환경 설정에 따라 적절한 Whisper 서비스 인스턴스 반환
   */
  static async createWhisperService(
    providerType?: WhisperProviderType,
    cacheDir?: string
  ): Promise<WhisperProvider> {
    
    // 기본값은 환경 변수에서 읽거나 'local'
    const selectedType = providerType || 
      (process.env.WHISPER_PROVIDER as WhisperProviderType) || 
      'local';

    // 이미 생성된 인스턴스가 있고 타입이 같으면 재사용
    if (this.instance && this.currentProviderType === selectedType) {
      return this.instance;
    }

    console.log(`[WhisperFactory] Whisper 서비스 생성: ${selectedType}`);

    try {
      let provider: WhisperProvider;

      switch (selectedType) {
        case 'openai':
          provider = await this.createOpenAIProvider(cacheDir);
          break;

        case 'local':
          provider = await this.createLocalProvider(cacheDir);
          break;

        case 'remote':
          provider = await this.createRemoteProvider(cacheDir);
          break;

        case 'auto':
          provider = await this.createAutoProvider(cacheDir);
          break;

        default:
          throw new Error(`지원하지 않는 Whisper 프로바이더: ${selectedType}`);
      }

      // 서비스 사용 가능성 확인
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new Error(`${provider.getProviderType()} Whisper 서비스를 사용할 수 없습니다.`);
      }

      // 인스턴스 캐싱
      this.instance = provider;
      this.currentProviderType = selectedType;

      console.log(`[WhisperFactory] ${provider.getProviderType()} Whisper 서비스 초기화 완료`);
      return provider;

    } catch (error) {
      console.error('[WhisperFactory] Whisper 서비스 생성 실패:', error);
      
      // 실패 시 폴백 로직
      if (selectedType !== 'local') {
        console.log('[WhisperFactory] 로컬 Whisper로 폴백 시도...');
        try {
          const fallbackProvider = await this.createLocalProvider(cacheDir);
          const isAvailable = await fallbackProvider.isAvailable();
          
          if (isAvailable) {
            this.instance = fallbackProvider;
            this.currentProviderType = 'local';
            console.log('[WhisperFactory] 로컬 Whisper 폴백 성공');
            return fallbackProvider;
          }
        } catch (fallbackError) {
          console.error('[WhisperFactory] 폴백도 실패:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * OpenAI Whisper 프로바이더 생성
   */
  private static async createOpenAIProvider(cacheDir?: string): Promise<OpenAIWhisperProvider> {
    const provider = new OpenAIWhisperProvider(cacheDir);
    
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error('OpenAI API 키가 설정되지 않았거나 유효하지 않습니다. OPENAI_API_KEY 환경 변수를 확인하세요.');
    }
    
    return provider;
  }

  /**
   * 로컬 Whisper 프로바이더 생성
   */
  private static async createLocalProvider(cacheDir?: string): Promise<LocalWhisperProvider> {
    const provider = new LocalWhisperProvider(cacheDir);
    
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(
        '로컬 Whisper가 설치되지 않았습니다. ' +
        'pip install openai-whisper 명령으로 설치하거나 ' +
        'WHISPER_PROVIDER=openai로 설정하여 OpenAI API를 사용하세요.'
      );
    }
    
    return provider;
  }

  /**
   * 원격 Whisper 프로바이더 생성
   */
  private static async createRemoteProvider(cacheDir?: string): Promise<RemoteWhisperProvider> {
    const provider = new RemoteWhisperProvider(cacheDir);

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(
        `원격 Whisper 서버에 연결할 수 없습니다 (${process.env.REMOTE_WHISPER_URL || '미설정'}). ` +
        'REMOTE_WHISPER_URL 환경변수와 서버 상태를 확인하세요.'
      );
    }

    return provider;
  }

  /**
   * 자동 선택 (우선순위: Remote -> Local -> OpenAI)
   */
  private static async createAutoProvider(cacheDir?: string): Promise<WhisperProvider> {
    console.log('[WhisperFactory] 자동 프로바이더 선택...');

    // 1. 원격 Whisper 서버 시도
    if (process.env.REMOTE_WHISPER_URL) {
      try {
        const remoteProvider = new RemoteWhisperProvider(cacheDir);
        const isRemoteAvailable = await remoteProvider.isAvailable();

        if (isRemoteAvailable) {
          console.log('[WhisperFactory] 원격 Whisper 선택됨');
          return remoteProvider;
        }
      } catch (error: any) {
        console.log('[WhisperFactory] 원격 Whisper 사용 불가:', error.message);
      }
    }

    // 2. 로컬 Whisper 시도
    try {
      const localProvider = new LocalWhisperProvider(cacheDir);
      const isLocalAvailable = await localProvider.isAvailable();

      if (isLocalAvailable) {
        console.log('[WhisperFactory] 로컬 Whisper 선택됨');
        return localProvider;
      }
    } catch (error: any) {
      console.log('[WhisperFactory] 로컬 Whisper 사용 불가:', error.message);
    }

    // 3. OpenAI API 시도
    try {
      const openaiProvider = new OpenAIWhisperProvider(cacheDir);
      const isOpenAIAvailable = await openaiProvider.isAvailable();

      if (isOpenAIAvailable) {
        console.log('[WhisperFactory] OpenAI Whisper 선택됨');
        return openaiProvider;
      }
    } catch (error: any) {
      console.log('[WhisperFactory] OpenAI Whisper 사용 불가:', error.message);
    }

    throw new Error(
      'Whisper 서비스를 사용할 수 없습니다. ' +
      '원격 서버(REMOTE_WHISPER_URL), 로컬 Whisper, 또는 OpenAI API 키를 설정하세요.'
    );
  }

  /**
   * 현재 사용 중인 프로바이더 정보 반환
   */
  static getCurrentProviderInfo(): { type: WhisperProviderType | null; provider: string | null } {
    return {
      type: this.currentProviderType,
      provider: this.instance?.getProviderType() || null
    };
  }

  /**
   * 사용 가능한 프로바이더 목록 확인
   */
  static async getAvailableProviders(): Promise<{
    openai: boolean;
    local: boolean;
    remote: boolean;
    recommended: WhisperProviderType;
  }> {
    const result = {
      openai: false,
      local: false,
      remote: false,
      recommended: 'local' as WhisperProviderType
    };

    // 원격 Whisper 사용 가능성 확인
    if (process.env.REMOTE_WHISPER_URL) {
      try {
        const remoteProvider = new RemoteWhisperProvider();
        result.remote = await remoteProvider.isAvailable();
      } catch (error) {
        result.remote = false;
      }
    }

    // OpenAI 사용 가능성 확인
    try {
      const openaiProvider = new OpenAIWhisperProvider();
      result.openai = await openaiProvider.isAvailable();
    } catch (error) {
      result.openai = false;
    }

    // 로컬 Whisper 사용 가능성 확인
    try {
      const localProvider = new LocalWhisperProvider();
      result.local = await localProvider.isAvailable();
    } catch (error) {
      result.local = false;
    }

    // 추천 프로바이더 결정
    if (result.remote) {
      result.recommended = 'remote';
    } else if (result.local) {
      result.recommended = 'local';
    } else if (result.openai) {
      result.recommended = 'openai';
    } else {
      result.recommended = 'local';
    }

    return result;
  }

  /**
   * 인스턴스 캐시 초기화 (테스트용)
   */
  static clearCache(): void {
    this.instance = null;
    this.currentProviderType = null;
  }

  /**
   * 설정 검증 및 설치 가이드 제공
   */
  static async validateSetup(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    const result = {
      isValid: false,
      errors: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };

    const availableProviders = await this.getAvailableProviders();

    // 에러 체크
    if (!availableProviders.openai && !availableProviders.local) {
      result.errors.push('Whisper 서비스를 사용할 수 없습니다.');
      result.recommendations.push('로컬 Whisper 설치: pip install openai-whisper');
      result.recommendations.push('또는 OpenAI API 키 설정: OPENAI_API_KEY 환경 변수');
    } else {
      result.isValid = true;
    }

    // 경고 및 추천
    if (!availableProviders.local && availableProviders.openai) {
      result.warnings.push('로컬 Whisper가 설치되지 않아 OpenAI API를 사용합니다.');
      result.recommendations.push('비용 절약을 위해 로컬 Whisper 설치를 권장합니다: pip install openai-whisper');
    }

    if (availableProviders.local && !availableProviders.openai) {
      result.warnings.push('OpenAI API 키가 설정되지 않았습니다.');
      result.recommendations.push('OpenAI API 백업 옵션 설정: OPENAI_API_KEY 환경 변수');
    }

    // 환경 변수 체크
    const whisperProvider = process.env.WHISPER_PROVIDER;
    if (whisperProvider && !['openai', 'local', 'remote', 'auto'].includes(whisperProvider)) {
      result.warnings.push(`잘못된 WHISPER_PROVIDER 설정: ${whisperProvider}`);
      result.recommendations.push('WHISPER_PROVIDER는 openai, local, remote, auto 중 하나여야 합니다.');
    }

    if (whisperProvider === 'remote' && !process.env.REMOTE_WHISPER_URL) {
      result.errors.push('WHISPER_PROVIDER=remote이지만 REMOTE_WHISPER_URL이 설정되지 않았습니다.');
      result.recommendations.push('REMOTE_WHISPER_URL 환경변수를 설정하세요 (예: http://localhost:8001)');
    }

    return result;
  }
}