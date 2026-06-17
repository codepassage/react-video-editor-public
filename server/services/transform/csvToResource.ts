/**
 * 📊 CSV 데이터를 리소스 구조로 변환하는 서비스 (CSV to Resource Converter)
 * 
 * 계층적 CSV 데이터를 비디오 에디터의 리소스 템플릿 구조로 변환
 * 4레벨 중첩 구조를 지원하며 반복자(Iterator) 패턴을 활용한 동적 콘텐츠 생성
 * 
 * 🎯 주요 기능:
 * - 4레벨 계층 구조 매핑 (Level 1-4)
 * - 반복자 컨테이너 자동 생성
 * - CSV 매핑 정보 파싱 및 검증
 * - 중첩 데이터 구조 변환
 * - 빈 데이터 필터링 및 정리
 * 
 * 🗂️ 데이터 구조:
 * - Level 1: 최상위 그룹 (예: 카테고리)
 * - Level 2: 하위 그룹 (예: 섹션)  
 * - Level 3: 개별 항목 (예: 제품)
 * - Level 4: 세부 속성 (예: 옵션)
 * 
 * 🔄 변환 프로세스:
 * 1. 매핑 정보 파싱 및 레벨 분류
 * 2. CSV 데이터 계층적 그룹화
 * 3. 템플릿 구조에 데이터 적용
 * 4. 반복자 컨테이너 생성
 * 5. 중첩 구조 검증 및 정리
 * 
 * 📝 매핑 스키마:
 * ```typescript
 * interface MappingRow {
 *   'level 1': string;  // 최상위 경로
 *   'level 2': string;  // 2레벨 경로
 *   'level 3': string;  // 3레벨 경로
 *   'level 4': string;  // 4레벨 경로
 *   'column': string;   // CSV 컬럼명
 * }
 * ```
 * 
 * 🔧 기술적 특징:
 * - 메모리 효율적 스트림 처리
 * - CSV 특수문자 처리 (\r\n 제거)
 * - 동적 경로 매칭 시스템
 * - 타입 안전성 보장
 * - 오류 처리 및 복구
 * 
 * @version 1.0.0
 * @author YouTube Generator Team
 * @since 2024-01-01
 */

import { ResourceData, ResourceItem } from '../../types/autoGeneration';

interface CsvRow {
  [key: string]: string;
}

interface MappingRow {
  'level 1': string;
  'level 2': string;
  'level 3': string;
  'level 4': string;
  'column': string;
}

export class CsvToResourceConverter {
  /**
   * CSV 데이터를 리소스 데이터로 변환
   */
  /**
   * 🔄 CSV 데이터를 리소스 템플릿에 적용하여 최종 ResourceData 생성
   * 
   * @param resourceTemplate - 변환할 기본 리소스 템플릿 구조
   * @param mapping - CSV 컬럼과 템플릿 경로 간의 매핑 정보
   * @param csvData - 실제 변환할 CSV 데이터 배열
   * @returns 데이터가 적용된 완성된 ResourceData
   */
  async convert(
    resourceTemplate: ResourceData,
    mapping: CsvRow[],
    csvData: CsvRow[]
  ): Promise<ResourceData> {
    console.log('🔄 CSV to Resource 변환 시작');

    // 1단계: 매핑 정보를 파싱하여 빠른 조회가 가능한 Map 구조로 변환
    const mappingInfo = this.parseMappingInfo(mapping);
    console.log('📋 매핑 정보:', mappingInfo);

    // 2단계: 원본 템플릿을 deep copy하여 수정 가능한 결과 객체 생성
    const result: ResourceData = JSON.parse(JSON.stringify(resourceTemplate));

    // 3단계: CSV 데이터를 4레벨 계층 구조로 그룹화
    const groupedData = this.groupCsvData(csvData, mappingInfo);
    console.log('📊 그룹화된 데이터:', groupedData);

    // 4단계: 그룹화된 데이터를 템플릿 구조에 적용
    this.applyDataToTemplate(result, groupedData, mappingInfo);

    return result;
  }

  /**
   * 🗺️ CSV 매핑 시트를 Map<column, MappingRow> 형태로 변환하는 함수
   *
   * 동작 단계
   * 1. 매핑 CSV의 각 행(row)을 순회하며 key/value 에 포함된 \r 등을 제거하고 trim 한다.
   * 2. 정제된 값을 이용해 MappingRow 객체를 생성한다.
   * 3. 컬럼명(column)을 Map의 key, MappingRow 를 value 로 저장하여 빠른 조회가 가능하도록 한다.
   * 4. 완성된 Map을 반환해 이후 경로 매칭 단계(groupCsvData, apply... 등)에서 활용한다.
   *
   * 반환: Map<string columnName , MappingRow>
   */
  private parseMappingInfo(mapping: CsvRow[]): Map<string, MappingRow> {
    const mappingMap = new Map<string, MappingRow>(); // 결과 저장용 Map 생성

    mapping.forEach(row => {
      // CSV 파싱 시 \r\n 문제를 해결하기 위해 모든 키와 값을 정제(clean)한다.
      const cleanRow: any = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.replace(/\r/g, '').trim();            // 열 이름에서 캐리지 리턴 제거
        const cleanValue = (row[key] || '').replace(/\r/g, '').trim(); // 값에서 캐리지 리턴 제거
        cleanRow[cleanKey] = cleanValue;                            // 정제된 key/value 저장
      });

      // MappingRow 객체 생성 (빈 문자열 대비해 fallback 처리)
      const mappingRow: MappingRow = {
        'level 1': cleanRow['level 1'] || '',  // 최상위 레벨 경로 (예: 'Section')
        'level 2': cleanRow['level 2'] || '',  // 2단계 레벨 경로 (예: 'Title')
        'level 3': cleanRow['level 3'] || '',  // 3단계 레벨 경로 (예: 'Content')
        'level 4': cleanRow['level 4'] || '',  // 4단계 레벨 경로 (예: 'SubContent')
        'column': cleanRow['column'] || ''     // 매핑될 CSV 컬럼명
      };

      // column 값이 존재할 때만 Map에 등록 (빈 행은 무시)
      // 이렇게 하면 O(1) 시간으로 컬럼명으로 매핑 정보 조회 가능
      if (mappingRow.column) {
        mappingMap.set(mappingRow.column, mappingRow);
      }
    });

    return mappingMap; // 완성된 매핑 정보 반환
  }

  /**
   * 📂 CSV 데이터를 계층 구조(hierarchicalData)로 그룹화하는 핵심 메서드
   *
   * 동작 흐름
   * 1. 매핑 정보를 분석하여 Level 1~4 각 레벨에 대응되는 CSV 컬럼명을 분류한다.
   * 2. CSV 행을 순회하며 Level 1 값이 등장할 때마다 새 그룹을 시작한다.
   * 3. 같은 Level 1 그룹 내에서 processLevel2Data → processLevel3Data 를 호출해
   *    Level 2 / 3 / 4 데이터를 단계적으로 중첩시킨다.
   * 4. 최종적으로 `hierarchicalData` 배열 형태의 트리 구조와 mappingInfo 를 반환한다.
   *
   * 반환 예시 (간략):
   * ```json
   * [
   *   {
   *     "level1Data": { "Category": "Electronics" },
   *     "level2Groups": [
   *       {
   *         "level2Data": { "Section": "Smartphone" },
   *         "level3Groups": [ { "level3Data": {...}, "level4Groups": [...] } ]
   *       }
   *     ]
   *   }
   * ]
   * ```
   */
  private groupCsvData(csvData: CsvRow[], mappingInfo: Map<string, MappingRow>): any {
    // 레벨별 컬럼 분류 객체 초기화
    // 각 레벨에 속하는 CSV 컬럼들을 분류하여 저장
    const levelColumns = {
      level1: [] as string[], // Level 1 컬럼 목록 (최상위 그룹 시작 지점)
      level2: [] as string[], // Level 2 컬럼 목록 (중간 그룹 시작 지점)
      level3: [] as string[], // Level 3 컬럼 목록 (개별 아이템 시작 지점)
      level4: [] as string[]  // Level 4 컬럼 목록 (세부 속성 데이터)
    };

    // 매핑 정보를 순회하며 각 컬럼을 해당 레벨 배열에 분류
    // 레벨 판단 로직: 해당 레벨은 있고 다음 레벨은 없으면 해당 레벨 전용
    mappingInfo.forEach((mapping, column) => {
      if (mapping['level 1'] && !mapping['level 2']) {        // Level 1 전용 컬럼
        levelColumns.level1.push(column);                      // Level1 목록에 등록
      } else if (mapping['level 2'] && !mapping['level 3']) {  // Level 2 전용 컬럼
        levelColumns.level2.push(column);                      // Level2 목록에 등록
      } else if (mapping['level 3'] && !mapping['level 4']) {  // Level 3 전용 컬럼
        levelColumns.level3.push(column);                      // Level3 목록에 등록
      } else if (mapping['level 4']) {                         // Level 4 컬럼 (최종 레벨)
        levelColumns.level4.push(column);                      // Level4 목록에 등록
      }
    });

    console.log('레벨별 컬럼:', levelColumns); // 디버그: 분류 결과 출력

    // 최종 계층 구조를 담을 배열
    // 구조: [{ level1Data: {}, level2Groups: [{ level2Data: {}, level3Groups: [...] }] }]
    const hierarchicalData: any[] = [];

    // 현재 처리 중인 Level 1 그룹 (상태 변수)
    let currentLevel1Group: any = null;

    // CSV 각 행을 순회하며 계층적 그룹화 수행
    csvData.forEach((row) => {
      const cleanRow = this.cleanRowData(row); // 특수문자(\r) 제거 및 trim 적용

      if (this.isEmptyRow(cleanRow)) return;   // 모든 셀이 비어있으면 해당 행 스킵

      // 현재 행이 새로운 Level 1 그룹 시작인지 판단
      // Level 1 컬럼 중 하나라도 데이터가 있으면 새 그룹 시작
      const hasNewLevel1 = this.hasDataInLevel(cleanRow, levelColumns.level1);

      if (hasNewLevel1) {
        // 이전 Level 1 그룹이 있고 하위 그룹이 존재하면 결과 배열에 추가
        if (currentLevel1Group && currentLevel1Group.level2Groups.length > 0) {
          hierarchicalData.push(currentLevel1Group);
        }

        // 새 Level 1 그룹 초기화
        currentLevel1Group = {
          level1Data: {} as any,    // Level 1 데이터 저장 공간
          level2Groups: [] as any[] // Level 2 그룹들의 배열
        };

        // Level 1 데이터 수집 및 저장
        levelColumns.level1.forEach((column: string) => {
          if (cleanRow[column]) {
            currentLevel1Group.level1Data[column] = cleanRow[column]; // 값 매핑
          }
        });
      }

      // 현재 Level 1 그룹이 존재하면 Level 2 이하 처리 위임
      if (currentLevel1Group) {
        this.processLevel2Data(cleanRow, currentLevel1Group, levelColumns);
      }
    });

    // 루프 종료 후 마지막 Level 1 그룹 push (누락 방지)
    if (currentLevel1Group && currentLevel1Group.level2Groups.length > 0) {
      hierarchicalData.push(currentLevel1Group);
    }

    // 디버그: 최종 구조 로그
    console.log('계층적 데이터 구조:', JSON.stringify(hierarchicalData, null, 2));

    // hierarchicalData, mappingInfo, 원본 CSV 데이터를 함께 반환
    return { hierarchicalData, mappingInfo, originalCsvData: csvData };
  }

  /**
   * 🧹 Row 데이터 정리 (CSV \r 문제 해결)
   * 
   * CSV 파싱 시 발생할 수 있는 캐리지 리턴(\r) 문자를 제거하고
   * 키와 값의 앞뒤 공백을 제거하여 정제된 객체를 반환
   * 
   * @param row - 정제할 원본 CSV 행 데이터
   * @returns 정제된 행 데이터 객체
   */
  private cleanRowData(row: any): any {
    const cleanRow: any = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.replace(/\r/g, '').trim();     // 키에서 \r 제거 및 trim
      cleanRow[cleanKey] = (row[key] || '').replace(/\r/g, '').trim(); // 값에서 \r 제거 및 trim
    });
    return cleanRow;
  }

  /**
   * 🔍 빈 행 체크
   * 
   * 행의 모든 값이 비어있거나 공백 문자열인지 확인
   * 빈 행은 처리 과정에서 무시됨
   * 
   * @param cleanRow - 검사할 정제된 행 데이터
   * @returns 빈 행이면 true, 아니면 false
   */
  private isEmptyRow(cleanRow: any): boolean {
    return Object.values(cleanRow).every(val =>
      !val || (typeof val === 'string' && val.trim() === '')
    );
  }

  /**
   * 🎯 특정 레벨에 데이터가 있는지 확인
   * 
   * 주어진 레벨의 컬럼들 중 하나라도 유효한 데이터가 있는지 검사
   * 새로운 그룹 시작 여부를 판단하는 데 사용
   * 
   * @param cleanRow - 검사할 정제된 행 데이터
   * @param levelColumns - 해당 레벨의 컬럼명 배열
   * @returns 데이터가 있으면 true, 없으면 false
   */
  private hasDataInLevel(cleanRow: any, levelColumns: string[]): boolean {
    return levelColumns.some(column => {
      const value = cleanRow[column];
      return value && typeof value === 'string' && value.trim() !== '';
    });
  }

  /**
   * 🔄 Level 2 데이터 처리
   * 
   * Level 2 그룹 생성 및 Level 3 처리로 위임
   * Level 2는 Level 1 그룹 내의 중간 계층 역할
   * 
   * @param cleanRow - 현재 처리 중인 정제된 행 데이터
   * @param currentLevel1Group - 현재 Level 1 그룹 객체
   * @param levelColumns - 레벨별 컬럼 분류 정보
   */
  private processLevel2Data(cleanRow: any, currentLevel1Group: any, levelColumns: any): void {
    // Level 2 새 그룹 시작 여부 확인
    const hasNewLevel2 = this.hasDataInLevel(cleanRow, levelColumns.level2);

    if (hasNewLevel2) {
      // 새 Level 2 그룹 생성
      const level2Group = {
        level2Data: {} as any,    // Level 2 데이터 저장 공간
        level3Groups: [] as any[] // Level 3 그룹들의 배열
      };

      // Level 2 데이터 수집 및 저장
      levelColumns.level2.forEach((column: string) => {
        if (cleanRow[column]) {
          level2Group.level2Data[column] = cleanRow[column];
        }
      });

      // 현재 Level 1 그룹에 Level 2 그룹 추가
      currentLevel1Group.level2Groups.push(level2Group);
    }

    // Level 3 처리 (현재 Level 2 그룹에 위임)
    if (currentLevel1Group.level2Groups.length > 0) {
      // 가장 최근에 추가된 Level 2 그룹에 Level 3 데이터 처리
      const currentLevel2Group = currentLevel1Group.level2Groups[currentLevel1Group.level2Groups.length - 1];
      this.processLevel3Data(cleanRow, currentLevel2Group, levelColumns);
    }
  }

  /**
   * 🔄 Level 3 데이터 처리
   * 
   * Level 3 아이템 생성 및 Level 4 데이터 처리
   * Level 3는 개별 아이템 단위의 데이터를 처리
   * 
   * @param cleanRow - 현재 처리 중인 정제된 행 데이터
   * @param currentLevel2Group - 현재 Level 2 그룹 객체
   * @param levelColumns - 레벨별 컬럼 분류 정보
   */
  private processLevel3Data(cleanRow: any, currentLevel2Group: any, levelColumns: any): void {
    const hasLevel3Data = this.hasDataInLevel(cleanRow, levelColumns.level3);

    if (hasLevel3Data) {
      // Level 3 아이템 생성
      const level3Item = {
        level3Data: {} as any,    // Level 3 데이터 저장 공간
        level4Groups: [] as any[] // Level 4 그룹들의 배열
      };

      // Level 3 데이터 수집 및 저장
      levelColumns.level3.forEach((column: string) => {
        if (cleanRow[column]) {
          level3Item.level3Data[column] = cleanRow[column];
        }
      });

      // Level 4 데이터 처리 (최종 레벨)
      const hasLevel4Data = this.hasDataInLevel(cleanRow, levelColumns.level4);
      if (hasLevel4Data) {
        const level4Item = { level4Data: {} as any };
        // Level 4 데이터 수집 (세부 속성 데이터)
        levelColumns.level4.forEach((column: string) => {
          if (cleanRow[column]) {
            level4Item.level4Data[column] = cleanRow[column];
          }
        });
        level3Item.level4Groups.push(level4Item);
      }

      // 현재 Level 2 그룹에 Level 3 아이템 추가
      currentLevel2Group.level3Groups.push(level3Item);
    }
  }

  /**
   * 📋 템플릿에 데이터 적용
   * 
   * 그룹화된 계층적 데이터를 리소스 템플릿 구조에 적용
   * 템플릿의 각 아이템과 매핑 정보를 기반으로 데이터를 주입
   * 
   * @param resourceTemplate - 데이터를 적용할 리소스 템플릿
   * @param groupedData - 그룹화된 계층적 데이터
   * @param mappingInfo - 컬럼-경로 매핑 정보
   */
  private applyDataToTemplate(
    resourceTemplate: ResourceData,
    groupedData: any,
    mappingInfo: Map<string, MappingRow>
  ): void {
    console.log('Applying data to resource template...', { groupedData: groupedData, templateItems: resourceTemplate.items.length });
    
    // 먼저 longSentence 타입 아이템들을 별도로 처리 (전체 CSV 행 순회 필요)
    this.processLongSentenceItems(resourceTemplate.items, groupedData, mappingInfo, '');
    
    // 계층적 구조를 재귀적으로 처리하여 템플릿 아이템들에 데이터 적용
    this.applyHierarchicalData(resourceTemplate.items, groupedData.hierarchicalData, mappingInfo, '');
  }

  /**
   * 📚 longSentence 타입 아이템들을 전체 CSV 행에서 처리
   * 
   * longSentence는 모든 CSV 행을 순회하며 데이터를 수집해야 함
   * Level 2 매핑이므로 groupedData가 아닌 원본 CSV 데이터에서 처리
   */
  private processLongSentenceItems(
    items: ResourceItem[],
    groupedData: any,
    mappingInfo: Map<string, MappingRow>,
    parentPath: string
  ): void {
    items.forEach(item => {
      const currentPath = parentPath ? `${parentPath}:${item.name}` : item.name;

      if (item.data?.type === 'long-sentence') {
        console.log(`📚 longSentence 아이템 발견: ${currentPath}`);
        
        // data.items 배열 초기화
        item.data.items = [];

        // 원본 CSV 데이터가 groupedData에 있는지 확인
        if (groupedData.originalCsvData) {
          // 모든 CSV 행을 순회하며 longSentence 데이터 수집
          groupedData.originalCsvData.forEach((csvRow: any) => {
            this.applyLongSentenceData(item, csvRow, mappingInfo, currentPath);
          });
        }
      } else if (item.containers) {
        // 중첩된 컨테이너 내부도 재귀적으로 처리
        item.containers.forEach(container => {
          this.processLongSentenceItems(container.items, groupedData, mappingInfo, currentPath);
        });
      }
    });
  }

  /**
   * 🔄 계층적 데이터를 템플릿에 적용
   * 
   * 템플릿 아이템들을 순회하며 각 아이템의 타입에 따라 처리
   * Iterator 아이템은 반복 구조로, 일반 아이템은 단일 데이터로 처리
   * 
   * @param items - 템플릿 아이템 배열
   * @param hierarchicalData - 계층적으로 구조화된 데이터
   * @param mappingInfo - 컬럼-경로 매핑 정보
   * @param parentPath - 부모 경로 (재귀 처리용)
   */
  private applyHierarchicalData(
    items: ResourceItem[],
    hierarchicalData: any[],
    mappingInfo: Map<string, MappingRow>,
    parentPath: string
  ): void {
    items.forEach(item => {
      // 현재 아이템의 전체 경로 생성 (부모경로:아이템이름)
      const currentPath = parentPath ? `${parentPath}:${item.name}` : item.name;

      if (item.isIterator && item.containers) {
        // 반복 구조 처리: 여러 데이터 그룹을 반복하여 컨테이너 생성
        this.handleHierarchicalIterator(item, hierarchicalData, mappingInfo, currentPath);
      } else if (item.data) {
        // 일반 아이템 데이터 적용 (첫 번째 Level 1 그룹에서)
        if (hierarchicalData.length > 0) {
          this.applyDataToSingleItemFromHierarchy(item, hierarchicalData[0], mappingInfo, currentPath);
        }
      }
    });
  }

  /**
   * 🔁 계층적 반복자 처리
   * 
   * Iterator 아이템의 템플릿 컨테이너를 복제하여 각 데이터 그룹마다 새로운 컨테이너 생성
   * Level 1 그룹의 각 Level 2 그룹에 대해 컨테이너를 생성하고 데이터 적용
   * 
   * @param item - 처리할 Iterator 아이템
   * @param hierarchicalData - 계층적 데이터 배열
   * @param mappingInfo - 컬럼-경로 매핑 정보
   * @param currentPath - 현재 아이템의 경로
   */
  private handleHierarchicalIterator(
    item: ResourceItem,
    hierarchicalData: any[],
    mappingInfo: Map<string, MappingRow>,
    currentPath: string
  ): void {
    const templateContainer = item.containers?.[0];
    if (!templateContainer) return; // 템플릿 컨테이너가 없으면 처리 중단

    item.containers = []; // 기존 컨테이너 배열 초기화

    // 각 Level 1 그룹에 대해 처리
    hierarchicalData.forEach((level1Group: any) => {
      // Level 2 그룹들을 처리하여 각각에 대해 새로운 컨테이너 생성
      if (level1Group.level2Groups) {
        level1Group.level2Groups.forEach((level2Group: any) => {
          // 템플릿 컨테이너를 깊은 복사로 복제
          const newContainer = JSON.parse(JSON.stringify(templateContainer));
          // 복제된 컨테이너에 Level 2 데이터 적용
          this.applyLevel2Container(newContainer, level2Group, mappingInfo, currentPath);
          // 완성된 컨테이너를 Iterator 아이템에 추가
          item.containers!.push(newContainer);
        });
      }
    });
  }

  /**
   * 📦 Level 2 컨테이너 적용
   * 
   * Level 2 컨테이너 내부의 아이템들을 순회하며 데이터 적용
   * 중첩된 Iterator가 있으면 Level 3 처리로 위임, 일반 아이템은 직접 처리
   * 
   * @param container - 처리할 Level 2 컨테이너
   * @param level2Group - Level 2 그룹 데이터
   * @param mappingInfo - 컬럼-경로 매핑 정보
   * @param parentPath - 부모 경로
   */
  private applyLevel2Container(
    container: any,
    level2Group: any,
    mappingInfo: Map<string, MappingRow>,
    parentPath: string
  ): void {
    container.items?.forEach((item: ResourceItem) => {
      const currentPath = `${parentPath}:${item.name}`;

      if (item.isIterator && item.containers) {
        // Level 3 중첩 반복 구조 처리
        const templateContainer = item.containers[0];
        if (templateContainer && level2Group.level3Groups) {
          item.containers = []; // 기존 컨테이너 배열 초기화

          // Level 3 그룹들에 대해 각각 새로운 컨테이너 생성
          level2Group.level3Groups.forEach((level3Group: any) => {
            const newContainer = JSON.parse(JSON.stringify(templateContainer));
            // Level 3 컨테이너 경로에 컨테이너 이름 포함
            const level3Path = `${currentPath}:${item.name}`;
            this.applyLevel3Container(newContainer, level3Group, mappingInfo, level3Path);
            item.containers!.push(newContainer);
          });
        }
      } else if (item.data) {
        // Level 2 아이템에 직접 데이터 적용
        this.applyDataToSingleItemFromLevel(item, level2Group.level2Data, mappingInfo, currentPath);
      }
    });
  }

  /**
   * 📦 Level 3 컨테이너 적용
   * 
   * Level 3 컨테이너 내부의 아이템들에 Level 3 데이터 적용
   * 최종 단계로 실제 데이터가 텍스트 필드에 주입되는 단계
   * 
   * @param container - 처리할 Level 3 컨테이너
   * @param level3Group - Level 3 그룹 데이터
   * @param mappingInfo - 컬럼-경로 매핑 정보
   * @param parentPath - 부모 경로
   */
  private applyLevel3Container(
    container: any,
    level3Group: any,
    mappingInfo: Map<string, MappingRow>,
    parentPath: string
  ): void {
    console.log(`🔄 Level 3 컨테이너 적용:`, {
      parentPath,
      level3Data: level3Group.level3Data,
      itemsCount: container.items?.length || 0
    });

    container.items?.forEach((item: ResourceItem) => {
      const currentPath = `${parentPath}:${item.name}`;

      if (item.data) {
        console.log(`  Level 3 아이템 처리: ${item.name} (${currentPath})`);
        // Level 3 아이템에 데이터 적용
        this.applyDataToSingleItemFromLevel(item, level3Group.level3Data, mappingInfo, currentPath);
      }
    });
  }

  /**
   * 🎯 계층적 데이터에서 단일 아이템에 데이터 적용
   * 
   * Level 1 그룹의 데이터에서 현재 아이템에 해당하는 데이터를 찾아 적용
   * 일반 아이템 (비-Iterator)에 대한 데이터 적용 처리
   * 
   * @param item - 데이터를 적용할 아이템
   * @param level1Group - Level 1 그룹 데이터
   * @param mappingInfo - 컬럼-경로 매핑 정보
   * @param currentPath - 현재 아이템의 경로
   */
  private applyDataToSingleItemFromHierarchy(
    item: ResourceItem,
    level1Group: any,
    mappingInfo: Map<string, MappingRow>,
    currentPath: string
  ): void {
    // Level 1 데이터에서 현재 아이템에 해당하는 데이터 찾기
    this.applyDataToSingleItemFromLevel(item, level1Group.level1Data, mappingInfo, currentPath);
  }

  /**
   * 🔍 특정 레벨(levelData)의 CSV 데이터를 템플릿의 단일 아이템(item)에 적용합니다.
   *
   * 매핑 정보(Map<column, MappingRow>)를 순회하면서 각 컬럼에 대해 매핑 경로(mappingPath)를 생성하고,
   * 현재 아이템의 실제 경로(currentPath)와 정확히 일치하는지 비교합니다.
   *
   * 지원하는 데이터 타입:
   * 1. text: 단일 텍스트 (기존 방식)
   * 2. long-sentence: items 배열에 text, mediaUrl 객체들 저장
   *
   * @param item        템플릿의 리소스 아이템
   * @param levelData   현재 계층(Level 1·2·3·4 중 하나)의 CSV 데이터 오브젝트
   * @param mappingInfo 컬럼명 ↔ 매핑 경로 정보를 담은 Map
   * @param currentPath 템플릿 상의 아이템 경로 (ex: "audio-01" or "Section:Title")
   */
  private applyDataToSingleItemFromLevel(
    item: ResourceItem,
    levelData: any,
    mappingInfo: Map<string, MappingRow>,
    currentPath: string
  ): void {
    console.log(`🔍 데이터 적용 시도: ${currentPath}`, {
      itemName: item.name,
      levelData: levelData,
      mappingCount: mappingInfo.size,
      itemDataType: item.data?.type
    });

    if (!item.data) {
      console.log(`  ❌ item.data가 없음`);
      return;
    }

    // long-sentence 타입 처리
    if (item.data.type === 'long-sentence') {
      this.applyLongSentenceData(item, levelData, mappingInfo, currentPath);
      return;
    }

    // 기존 text 타입 처리
    this.applyTextData(item, levelData, mappingInfo, currentPath);
  }

  /**
   * 📝 기존 text 타입 데이터 적용 (기존 로직)
   */
  private applyTextData(
    item: ResourceItem,
    levelData: any,
    mappingInfo: Map<string, MappingRow>,
    currentPath: string
  ): void {
    // 매핑 정보에서 현재 경로에 해당하는 컬럼 찾기
    for (const [column, mapping] of mappingInfo) {
      const mappingPath = this.buildMappingPath(mapping);

      console.log(`  매핑 확인: ${mappingPath} vs ${currentPath} (컬럼: ${column})`);

      // 매핑 경로와 현재 아이템 경로가 정확히 일치하는지 확인
      if (mappingPath === currentPath) {
        console.log(`  ✅ 매핑 일치! 컬럼: ${column}`);
        const value = levelData[column];
        console.log(`  데이터 값: "${value}"`);

        if (value && item.data) {
          // 단일 텍스트 데이터인 경우 직접 text 필드에 값 주입
          item.data.text = value;
          console.log(`  ✅ 텍스트 적용됨: "${value}"`);
        } else {
          console.log(`  ❌ 값이 없거나 item.data가 없음`);
        }
        break; // 일치하는 매핑을 찾았으므로 루프 종료
      }
    }
  }

  /**
   * 📚 long-sentence 타입 데이터 적용
   * 
   * long-sentence 타입은 data.items 배열에 여러 객체를 저장:
   * - 매핑 형식: "long-sentence-01:text", "long-sentence-01:mediaUrl"
   * - 결과 구조: data.items = [{ text: "...", mediaUrl: "..." }, ...]
   * - 같은 행의 데이터는 같은 아이템 객체에, 다른 행은 다른 아이템 객체에 저장
   */
  private applyLongSentenceData(
    item: ResourceItem,
    levelData: any,
    mappingInfo: Map<string, MappingRow>,
    currentPath: string
  ): void {
    console.log(`📚 long-sentence 데이터 적용: ${currentPath}`);

    // data.items 배열 초기화 (빈 배열이면 유지, 없으면 생성)
    if (!item.data!.items || !Array.isArray(item.data!.items)) {
      item.data!.items = [];
    }

    // currentPath와 일치하는 매핑들을 찾아서 속성별로 그룹화
    const relevantMappings = new Map<string, string>(); // column -> property

    for (const [column, mapping] of mappingInfo) {
      const mappingPath = this.buildMappingPath(mapping);
      
      // "long-sentence-01:text" 형식에서 "long-sentence-01"과 "text" 분리
      if (mappingPath.startsWith(currentPath + ':')) {
        const property = mappingPath.substring(currentPath.length + 1);
        relevantMappings.set(column, property);
        console.log(`  관련 매핑 발견: ${column} -> ${property}`);
      }
    }

    // 현재 행에서 long-sentence 관련 데이터가 있는지 확인
    const currentRowData: any = {};
    let hasData = false;

    for (const [column, property] of relevantMappings) {
      const value = levelData[column];
      if (value !== undefined && value !== null && value !== '') {
        currentRowData[property] = value;
        hasData = true;
        console.log(`  데이터 수집: ${property} = "${value}"`);
      }
    }

    // 데이터가 있으면 items 배열에 새 아이템 추가
    if (hasData) {
      // 기본 구조 생성 (text, mediaUrl)
      const newItem: any = {
        text: currentRowData.text || '',
        mediaUrl: currentRowData.mediaUrl || ''
      };

      // 추가 속성들도 포함
      for (const [property, value] of Object.entries(currentRowData)) {
        if (property !== 'text' && property !== 'mediaUrl') {
          newItem[property] = value;
        }
      }

      item.data!.items.push(newItem);
      console.log(`  ✅ long-sentence 아이템 추가:`, newItem);
    }
  }

  /**
   * 🗺️ 매핑 경로 생성
   * 
   * MappingRow의 레벨 정보를 콜론(:)으로 연결하여 경로 문자열 생성
   * 예: 'Section:Title' 또는 'Section:Content:SubItem'
   * 
   * @param mapping - 매핑 정보 객체
   * @returns 생성된 경로 문자열
   */
  private buildMappingPath(mapping: MappingRow): string {
    const parts = [];
    // Level 1부터 4까지 순서대로 경로 부분 수집
    if (mapping['level 1']) parts.push(mapping['level 1']);
    if (mapping['level 2']) parts.push(mapping['level 2']);
    if (mapping['level 3']) parts.push(mapping['level 3']);
    if (mapping['level 4']) parts.push(mapping['level 4']);
    // 콜론으로 연결하여 최종 경로 생성
    return parts.join(':');
  }
}