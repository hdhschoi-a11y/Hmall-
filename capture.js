// capture.js
// hmall.com 검색창 화면(급상승 검색어 패널)을 캡쳐하는 스크립트

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_URL = 'https://www.hmall.com/md/dpl/index';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// 파일명에 캡쳐 날짜를 포함 (예: 2026-08-10.png)
function getDateString() {
  const now = new Date();
  // KST(UTC+9) 기준 날짜로 변환
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    // 스크린샷 예시가 모바일 화면 비율이라 모바일 뷰포트로 설정
    viewport: { width: 390, height: 950 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  console.log(`페이지 접속: ${TARGET_URL}`);
  // networkidle은 광고/트래킹 스크립트가 계속 도는 사이트에서 절대 안 끝날 수 있어
  // domcontentloaded(뼈대만 로드) 기준으로 바꾸고, 타임아웃도 넉넉하게 잡습니다.
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // 페이지 로드 직후 렌더링 안정화를 위한 대기
  await page.waitForTimeout(2000);

  // 초기 진입 시 뜨는 하단 팝업 배너(role="dialog") 닫기
  // 팝업이 없는 경우도 있으므로 실패해도 무시하고 진행
  try {
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 });
    console.log('팝업 발견, 닫기 시도');

    const closeBtn = dialog.getByText('닫기');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('팝업 닫기 완료');
  } catch (e) {
    console.log('팝업을 정상적으로 닫지 못함 (강제 숨김으로 대체):', e.message);
  }

  // 안전장치: 위 시도로도 남아있는 팝업(dialog)이 있다면 강제로 화면에서 숨김
  // (검색창 클릭을 가로채는 것을 방지)
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      el.style.display = 'none';
    });
  });

  // 상단 검색창 클릭 (실제 요소: id="searchActive")
  const searchBox = page.locator('#searchActive');
  await searchBox.waitFor({ state: 'visible', timeout: 30000 });
  await searchBox.click();

  // "급상승 검색어" 패널이 뜰 때까지 대기
  await page.waitForSelector('text=급상승 검색어', { timeout: 30000 });

  // 패널 렌더링(애니메이션 등) 안정화를 위한 짧은 대기
  await page.waitForTimeout(1000);

  const dateStr = getDateString();
  const outputPath = path.join(OUTPUT_DIR, `${dateStr}.png`);

  // 화면 전체(뷰포트) 캡쳐 - 검색창 패널이 화면 전체를 덮는 구조이므로 뷰포트 캡쳐로 충분
  await page.screenshot({ path: outputPath });

  console.log(`캡쳐 완료: ${outputPath}`);

  await browser.close();
})().catch((err) => {
  console.error('캡쳐 중 오류 발생:', err);
  process.exit(1);
});
