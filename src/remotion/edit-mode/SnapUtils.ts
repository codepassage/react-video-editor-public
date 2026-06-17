// 격자 및 스냅 기능 유틸리티
export const GRID_SIZE = 10; // 격자 크기 (픽셀)
export const SNAP_THRESHOLD = 5; // 스냅 임계값 (픽셀)

// 격자에 맞춰 위치 조정
export const snapToGrid = (value: number, gridSize: number = GRID_SIZE): number => {
  return Math.round(value / gridSize) * gridSize;
};

// 두 점 사이의 거리 계산
export const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// 아이템들 사이의 정렬 가이드라인 검사
export const getAlignmentGuides = (
  draggedItem: { left: number; top: number; width: number; height: number },
  otherItems: Array<{ left: number; top: number; width: number; height: number; id: string }>,
  threshold: number = SNAP_THRESHOLD
): {
  vertical: Array<{ x: number; fromY: number; toY: number }>;
  horizontal: Array<{ y: number; fromX: number; toX: number }>;
  snapX?: number;
  snapY?: number;
} => {
  const guides = {
    vertical: [] as Array<{ x: number; fromY: number; toY: number }>,
    horizontal: [] as Array<{ y: number; fromX: number; toX: number }>,
    snapX: undefined as number | undefined,
    snapY: undefined as number | undefined,
  };

  const draggedCenterX = draggedItem.left + draggedItem.width / 2;
  const draggedCenterY = draggedItem.top + draggedItem.height / 2;
  const draggedRight = draggedItem.left + draggedItem.width;
  const draggedBottom = draggedItem.top + draggedItem.height;

  otherItems.forEach(item => {
    const itemCenterX = item.left + item.width / 2;
    const itemCenterY = item.top + item.height / 2;
    const itemRight = item.left + item.width;
    const itemBottom = item.top + item.height;

    // 수직 정렬 검사 (X축)
    const verticalChecks = [
      { check: Math.abs(draggedItem.left - item.left), snap: item.left }, // 왼쪽 정렬
      { check: Math.abs(draggedCenterX - itemCenterX), snap: itemCenterX - draggedItem.width / 2 }, // 중앙 정렬
      { check: Math.abs(draggedRight - itemRight), snap: itemRight - draggedItem.width }, // 오른쪽 정렬
    ];

    // 수평 정렬 검사 (Y축)
    const horizontalChecks = [
      { check: Math.abs(draggedItem.top - item.top), snap: item.top }, // 상단 정렬
      { check: Math.abs(draggedCenterY - itemCenterY), snap: itemCenterY - draggedItem.height / 2 }, // 중앙 정렬
      { check: Math.abs(draggedBottom - itemBottom), snap: itemBottom - draggedItem.height }, // 하단 정렬
    ];

    // 스냅 검사
    verticalChecks.forEach(({ check, snap }) => {
      if (check <= threshold) {
        guides.snapX = snap;
        guides.vertical.push({
          x: snap + (guides.snapX === snap ? draggedItem.width / 2 : 0),
          fromY: Math.min(draggedItem.top, item.top) - 10,
          toY: Math.max(draggedBottom, itemBottom) + 10,
        });
      }
    });

    horizontalChecks.forEach(({ check, snap }) => {
      if (check <= threshold) {
        guides.snapY = snap;
        guides.horizontal.push({
          y: snap + (guides.snapY === snap ? draggedItem.height / 2 : 0),
          fromX: Math.min(draggedItem.left, item.left) - 10,
          toX: Math.max(draggedRight, itemRight) + 10,
        });
      }
    });
  });

  return guides;
};

// 자석 효과 (마그네틱 스냅)
export const applyMagneticSnap = (
  newX: number,
  newY: number,
  item: { width: number; height: number },
  otherItems: Array<{ left: number; top: number; width: number; height: number; id: string }>,
  threshold: number = SNAP_THRESHOLD
): { x: number; y: number } => {
  let snappedX = newX;
  let snappedY = newY;

  const draggedItem = {
    left: newX,
    top: newY,
    width: item.width,
    height: item.height,
  };

  const guides = getAlignmentGuides(draggedItem, otherItems, threshold);

  if (guides.snapX !== undefined) {
    snappedX = guides.snapX;
  }

  if (guides.snapY !== undefined) {
    snappedY = guides.snapY;
  }

  return { x: snappedX, y: snappedY };
};
