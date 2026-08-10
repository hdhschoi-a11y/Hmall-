# hmall.com 검색창 화면 매일 자동 캡쳐

hmall.com의 검색창을 눌렀을 때 뜨는 "급상승 검색어" 패널 화면을 매일 오전 8시(KST)에
자동으로 캡쳐해서 이 저장소의 `screenshots/` 폴더에 날짜별로 저장합니다.

## 사용 방법

1. GitHub에 새 저장소(Repository)를 만듭니다. (Public이든 Private이든 상관없습니다)
2. 이 폴더(`hmall-capture`)의 파일들을 그대로 그 저장소에 업로드합니다.
   - `capture.js`
   - `package.json`
   - `.github/workflows/daily-capture.yml`
   - `screenshots/` 폴더 (비어 있어도 됨)
3. 저장소 설정에서 Actions 쓰기 권한을 확인합니다.
   - GitHub 저장소 → **Settings → Actions → General → Workflow permissions**
   - **"Read and write permissions"** 선택 후 저장
   (이 설정이 안 되어 있으면 캡쳐 이미지를 저장소에 커밋하지 못합니다.)
4. 그대로 두면 **매일 UTC 23:00(=한국시간 오전 8시)**에 자동 실행됩니다.
5. 바로 테스트해보고 싶다면:
   - 저장소 → **Actions** 탭 → `Daily Hmall Search Panel Capture` 워크플로우 선택
   - **Run workflow** 버튼으로 수동 실행 가능

## 결과 확인

캡쳐된 이미지는 `screenshots/2026-08-10.png` 형식으로 저장소에 쌓입니다.

## 참고 사항

- hmall.com 사이트 구조(HTML)가 바뀌면 `capture.js`의 검색창 선택자
  (`page.getByPlaceholder('검색어를 입력해 주세요')`) 또는 대기 조건
  (`text=급상승 검색어`)을 실제 화면에 맞게 수정해야 할 수 있습니다.
- 캡쳐 시점의 실시간 데이터(급상승 검색어 등)가 그대로 이미지에 담기므로,
  매일 다른 내용이 저장됩니다.
