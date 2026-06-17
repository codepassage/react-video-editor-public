# Docker Setup Guide for React Video Editor

이 문서는 React Video Editor 프로젝트의 Docker 환경 설정 가이드입니다.

## 🐳 Docker 환경 개요

프로젝트는 **하이브리드 Docker 접근 방식**을 사용합니다:

- **개발 시**: PostgreSQL + Redis만 Docker로 실행, 앱은 로컬에서 개발
- **배포 시**: 전체 스택을 Docker 컨테이너로 패키징

## 📋 사전 요구사항

- Docker 및 Docker Compose 설치
- Node.js 18+ (개발 환경용)
- npm 또는 yarn

## 🚀 빠른 시작

### 1. 개발 환경 시작

가장 간단한 방법:

```bash
./start_dev_docker.sh
```

또는 수동으로:

```bash
# 1. Docker 인프라 시작 (PostgreSQL + Redis)
docker-compose -f docker-compose.dev.yml up -d

# 2. 서비스 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 3. 로컬 개발 서버 시작
npm run dev
```

### 2. 서비스 접근

- **Frontend**: http://localhost:3004
- **Backend**: http://localhost:5002
- **PostgreSQL**: localhost:5432 (username: postgres, password: postgres)
- **Redis**: localhost:6379
- **Redis Commander** (선택사항): http://localhost:8081

## 📁 파일 구조

```
├── docker-compose.dev.yml      # 개발용 (DB + Redis만)
├── docker-compose.prod.yml     # 프로덕션용 (전체 스택)
├── Dockerfile                  # 앱 컨테이너 정의
├── .dockerignore              # Docker 빌드 제외 파일
├── .env.docker.dev            # 개발용 환경 변수
├── .env.docker.prod           # 프로덕션용 환경 변수
└── start_dev_docker.sh        # 개발 환경 시작 스크립트
```

## 🔧 개발 워크플로우

### 일상적인 개발

1. **처음 시작할 때**:
   ```bash
   ./start_dev_docker.sh
   ```

2. **다음번부터**:
   ```bash
   # Docker 서비스가 이미 실행 중이라면
   npm run dev
   ```

3. **작업 종료**:
   - `Ctrl+C`로 개발 서버 종료
   - Docker 서비스는 계속 실행 (다음 세션에서 재사용)

### 완전 종료

```bash
# 모든 Docker 서비스 종료
docker-compose -f docker-compose.dev.yml down
```

## 🏗️ 프로덕션 배포

### 프로덕션 빌드 및 실행

```bash
# 1. 환경 변수 설정 (실제 배포 시 보안 강화 필요)
cp .env.docker.prod .env

# 2. 전체 스택 시작
docker-compose -f docker-compose.prod.yml up -d

# 3. 상태 확인
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### 보안 설정 (중요)

프로덕션 배포 전에 `.env.docker.prod` 파일의 다음 값들을 변경하세요:

```bash
DB_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password
```

## 🗂️ 데이터 영속성

### 개발 환경

- **PostgreSQL 데이터**: `postgres_data_dev` 볼륨
- **Redis 데이터**: `redis_data_dev` 볼륨

### 프로덕션 환경

- **데이터베이스**: `postgres_data_prod` 볼륨
- **업로드 파일**: `app_uploads` 볼륨
- **렌더링된 비디오**: `app_renders` 볼륨
- **템플릿**: `app_templates` 볼륨
- **폰트**: `app_fonts` 볼륨

## 🔍 문제 해결

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3004  # Frontend
lsof -i :5002  # Backend
```

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
docker-compose -f docker-compose.dev.yml logs
docker-compose -f docker-compose.dev.yml logs db
docker-compose -f docker-compose.dev.yml logs redis
```

### 데이터베이스 초기화

```bash
# 개발 환경 데이터베이스 리셋
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### 컨테이너 재빌드

```bash
# 프로덕션 이미지 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache
```

## 🛠️ 고급 사용법

### Redis Commander 사용

Redis 데이터를 시각적으로 관리하려면:

```bash
docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander
```

http://localhost:8081에서 접근 가능

### 로그 모니터링

```bash
# 실시간 로그 추적
docker-compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그만
docker-compose -f docker-compose.dev.yml logs -f db
```

### 볼륨 관리

```bash
# 볼륨 목록 확인
docker volume ls

# 개발 데이터 백업
docker run --rm -v react-video-editor_postgres_data_dev:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## 📞 지원

문제가 발생하면:

1. 로그 확인: `docker-compose -f docker-compose.dev.yml logs`
2. 서비스 상태 확인: `docker-compose -f docker-compose.dev.yml ps`
3. 포트 충돌 확인: `lsof -i :포트번호`
4. 완전 재시작: `docker-compose -f docker-compose.dev.yml down && docker-compose -f docker-compose.dev.yml up -d`