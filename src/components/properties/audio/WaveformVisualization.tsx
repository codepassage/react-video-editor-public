import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Volume2 } from 'lucide-react';

interface WaveformVisualizationProps {
  audioUrl?: string;
  duration: number;
  currentTime?: number;
  volume: number;
  onTimeChange?: (time: number) => void;
  onPlayToggle?: () => void;
  isPlaying?: boolean;
}

/**
 * 파형 시각화 컴포넌트
 * @description Canvas를 사용한 고성능 오디오 파형 렌더링
 * - 실시간 파형 표시
 * - 인터랙티브 재생 위치 제어
 * - 확대/축소 기능
 * - 구간 선택 및 편집
 */
export const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  audioUrl,
  duration,
  currentTime = 0,
  volume,
  onTimeChange,
  onPlayToggle,
  isPlaying = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<{start: number, end: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // 파형 데이터 생성 (데모용 - 실제로는 Web Audio API 사용)
  const generateWaveformData = useCallback((samples: number) => {
    const data = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      // 실제 오디오 데이터 대신 데모용 사인파 생성
      const time = (i / samples) * duration;
      data[i] = Math.sin(time * Math.PI * 2) * Math.exp(-time * 0.1) * 0.8;
      
      // 볼륨에 따른 파형 크기 조정
      data[i] *= volume;
      
      // 랜덤 노이즈 추가 (실제 오디오 파형 시뮬레이션)
      data[i] += (Math.random() - 0.5) * 0.2;
    }
    return data;
  }, [duration, volume]);

  // Canvas에 파형 그리기
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 배경 그라디언트
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
    bgGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
    bgGradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 파형 데이터 생성
    const samples = Math.floor(width * zoomLevel);
    const waveformData = generateWaveformData(samples);
    
    // 파형 그리기
    const centerY = height / 2;
    const amplitude = height * 0.4;
    
    // 파형 선
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < width; i++) {
      const sampleIndex = Math.floor((i / width) * samples);
      const value = waveformData[sampleIndex] || 0;
      const y = centerY + (value * amplitude);
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // 파형 채우기 (상단)
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, 0, 0, centerY);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
    ctx.fillStyle = gradient;
    
    for (let i = 0; i < width; i++) {
      const sampleIndex = Math.floor((i / width) * samples);
      const value = Math.abs(waveformData[sampleIndex] || 0);
      const y = centerY - (value * amplitude);
      
      if (i === 0) {
        ctx.moveTo(i, centerY);
        ctx.lineTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();

    // 파형 채우기 (하단)
    ctx.beginPath();
    const gradientBottom = ctx.createLinearGradient(0, centerY, 0, height);
    gradientBottom.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
    gradientBottom.addColorStop(1, 'rgba(139, 92, 246, 0.6)');
    ctx.fillStyle = gradientBottom;
    
    for (let i = 0; i < width; i++) {
      const sampleIndex = Math.floor((i / width) * samples);
      const value = Math.abs(waveformData[sampleIndex] || 0);
      const y = centerY + (value * amplitude);
      
      if (i === 0) {
        ctx.moveTo(i, centerY);
        ctx.lineTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();

    // 현재 재생 위치 표시
    if (duration > 0) {
      const progress = currentTime / duration;
      const x = progress * width;
      
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // 재생 헤드
      ctx.beginPath();
      ctx.fillStyle = '#ef4444';
      ctx.arc(x, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 선택된 영역 표시
    if (selectedRegion) {
      const startX = (selectedRegion.start / duration) * width;
      const endX = (selectedRegion.end / duration) * width;
      
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, height);
    }

    // 중앙선
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // 시간 마커들
    ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.font = '10px monospace';
    const markerInterval = Math.max(1, Math.floor(duration / 10));
    
    for (let time = 0; time <= duration; time += markerInterval) {
      const x = (time / duration) * width;
      const timeLabel = `${time.toFixed(1)}s`;
      
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      ctx.fillText(timeLabel, x - 10, height - 5);
    }
  }, [currentTime, duration, volume, zoomLevel, selectedRegion, generateWaveformData]);

  // Canvas 크기 조정 및 파형 다시 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200; // 고정 높이
        drawWaveform();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawWaveform]);

  // 파형 다시 그리기 (상태 변경 시)
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Canvas 클릭 핸들러
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onTimeChange) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / canvas.width;
    const newTime = progress * duration;
    
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
  };

  // 마우스 드래그 핸들러 (구간 선택)
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.shiftKey) {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const time = (x / canvas.width) * duration;
        setDragStart(time);
        setSelectedRegion(null);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const time = (x / canvas.width) * duration;
        
        setSelectedRegion({
          start: Math.min(dragStart, time),
          end: Math.max(dragStart, time)
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 줌 컨트롤
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  return (
    <div className="space-y-4">
      {/* 파형 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h5 className="text-white font-medium flex items-center space-x-2">
            <Volume2 size={16} className="text-purple-400" />
            <span>오디오 파형</span>
          </h5>
          
          {isLoading && (
            <div className="text-gray-400 text-sm">파형 로딩 중...</div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 재생 컨트롤 */}
          <button
            onClick={onPlayToggle}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying 
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          {/* 줌 컨트롤 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="축소"
            >
              <ZoomOut size={14} />
            </button>
            
            <span className="text-white text-sm px-2">
              {zoomLevel.toFixed(1)}×
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="확대"
            >
              <ZoomIn size={14} />
            </button>
            
            <button
              onClick={handleZoomReset}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="리셋"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 파형 캔버스 */}
      <div className="relative bg-gray-900 rounded-lg border border-purple-500/30 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full cursor-pointer"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <div className="text-white text-sm">파형을 분석하는 중...</div>
          </div>
        )}
      </div>

      {/* 파형 정보 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
          <span className="text-gray-300">재생 시간:</span>
          <span className="text-white font-mono">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>
        
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
          <span className="text-gray-300">줌 레벨:</span>
          <span className="text-white font-mono">{zoomLevel.toFixed(1)}×</span>
        </div>
        
        {selectedRegion && (
          <div className="col-span-2 flex justify-between items-center p-2 bg-green-800/20 border border-green-500/30 rounded">
            <span className="text-green-300">선택 구간:</span>
            <span className="text-green-200 font-mono">
              {selectedRegion.start.toFixed(2)}s ~ {selectedRegion.end.toFixed(2)}s 
              ({(selectedRegion.end - selectedRegion.start).toFixed(2)}s)
            </span>
            <button
              onClick={() => setSelectedRegion(null)}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
            >
              지우기
            </button>
          </div>
        )}
      </div>

      {/* 사용법 안내 */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• 클릭: 재생 위치 이동</div>
        <div>• Shift + 드래그: 구간 선택</div>
        <div>• 줌 버튼: 파형 확대/축소</div>
      </div>
    </div>
  );
};

export default WaveformVisualization;
