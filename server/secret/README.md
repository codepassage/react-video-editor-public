# Service Account Credentials

이 디렉토리에 Google Cloud 서비스 계정 키(JSON)를 두세요. **키 파일은 절대 커밋하지 마세요.**

1. Google Cloud Console → IAM & Admin → Service Accounts 에서 키 발급
2. 내려받은 JSON을 `server/secret/service-account.json` 으로 저장
3. `.env` 에 경로 설정:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=server/secret/service-account.json
   ```

`.gitignore` 가 이 디렉토리의 모든 파일을 무시하도록 설정되어 있습니다 (이 README 제외).
