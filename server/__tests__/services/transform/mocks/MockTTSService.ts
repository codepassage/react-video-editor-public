export class MockTTSService {
  constructor() {
    // Simple mock, no inheritance to avoid circular dependencies
  }

  async generateAudio(params: any): Promise<{ url: string; duration: number }> {
    // Mock TTS response - simulate realistic duration based on text length
    const text = params.text || '';
    const estimatedDuration = Math.max(0.5, text.length * 0.08); // ~0.08 seconds per character
    
    return {
      url: `mock-tts-${Date.now()}.mp3`,
      duration: estimatedDuration
    };
  }

  async getVoices(): Promise<any[]> {
    return [
      {
        name: 'ko-KR-Standard-A',
        languageCode: 'ko-KR',
        ssmlGender: 'FEMALE'
      },
      {
        name: 'en-US-Standard-A',
        languageCode: 'en-US',
        ssmlGender: 'FEMALE'
      }
    ];
  }
}