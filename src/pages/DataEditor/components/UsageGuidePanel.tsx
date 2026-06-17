import React from 'react';

export const UsageGuidePanel: React.FC = () => {
  return (
    <div className="usage-guide">
      <h3>📖 사용 방법</h3>
      <ol>
        <li>왼쪽에서 템플릿을 선택하거나 업로드하세요</li>
        <li>템플릿의 Dynamic Properties가 설정된 클립들이 자동으로 인식됩니다</li>
        <li>리소스 데이터를 추가하고 클립 이름과 매칭하세요</li>
        <li>텍스트 입력 시 TTS가 자동으로 생성됩니다</li>
        <li>"변환 실행" 버튼을 클릭하여 결과를 확인하세요</li>
        <li>변환된 결과를 렌더링하거나 에디터로 보낼 수 있습니다</li>
      </ol>

      <h4>🔄 중첩 번들 시스템</h4>
      <ul>
        <li><strong>일반 폼</strong>: 기존 단일 레벨 번들 편집</li>
        <li><strong>중첩 폼</strong>: 다단계 중첩 구조 지원 (템플릿 그룹 {'>'} 번들 {'>'} 클립)</li>
        <li>중첩 구조가 감지되면 자동으로 중첩 폼으로 전환됩니다</li>
        <li>우상단 "폼" 버튼으로 수동 전환 가능</li>
      </ul>

      <h4>💡 팁</h4>
      <ul>
        <li>JSON 편집기의 데이터를 템플릿이나 리소스로 가져올 수 있습니다</li>
        <li>반복 아이템(번들)을 사용하면 여러 콘텐츠를 자동으로 생성할 수 있습니다</li>
        <li>중첩 폼에서는 최대 3단계까지 구조를 만들 수 있습니다</li>
        <li>TTS 언어는 ko(한국어), en(영어) 등을 지원합니다</li>
        <li>패널 경계를 드래그하여 크기를 조정할 수 있습니다</li>
      </ul>
    </div>
  );
};