// capture-topbanner.js
// hmall.com 초특가샵 페이지의 상단 롤링 배너(탑배너) 중
// 4번째, 5번째, 6번째 배너가 보일 때의 화면을 각각 캡쳐하는 스크립트

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_URL = 'https://www.hmall.com/md/dpa/searchSpexSectItem?sectId=3107994';
const OUTPUT_DIR = path.join(__dirname, '초특가샵 탑배너(6번째)');

// Swiper는 0부터 세므로, N번째 배너 = index (N-1)
// 4번째, 5번째, 6번째 배너를 순서대로 캡쳐
const TARGET_SLIDES = [
  { label: '4번', index: 3 },
  { label: '5번', index: 4 },
  { label: '6번', index: 5 },
];

function getDateString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 950 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  console.log(`페이지 접속: ${TARGET_URL}`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2000);

  // 혹시 뜰 수 있는 팝업 배너 처리 (있으면 닫고, 없으면 그냥 진행)
  try {
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    const closeBtn = dialog.getByText('닫기');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ timeout: 5000 });
    } else {
      await page.keyboard.press('Escape');
    }
    console.log('팝업 닫기 완료');
  } catch (e) {
    console.log('닫을 팝업 없음 (정상 진행)');
  }
  // 안전장치: 남아있는 팝업 강제 숨김
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      el.style.display = 'none';
    });
  });

  const dateStr = getDateString();

  // 4번째 → 5번째 → 6번째 배너 순서대로 각각 대기 후 캡쳐
  for (const { label, index } of TARGET_SLIDES) {
    const targetSlide = page.locator(
      `.swiper-slide-active[data-swiper-slide-index="${index}"]`
    );
    // 자동 롤링이므로 최대 60초까지 기다림
    await targetSlide.waitFor({ state: 'visible', timeout: 60000 });
    console.log(`${label}째 배너 활성화 확인`);

    // 렌더링 안정화를 위한 짧은 대기
    await page.waitForTimeout(500);

    const outputPath = path.join(OUTPUT_DIR, `${dateStr}_${label}.png`);
    await page.screenshot({ path: outputPath });
    console.log(`캡쳐 완료: ${outputPath}`);
  }

  await browser.close();
})().catch((err) => {
  console.error('캡쳐 중 오류 발생:', err);
  process.exit(1);
});
