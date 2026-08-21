// capture-syorapick.js
// hmall.com 메인 -> 모바일라이브 탭 -> "쇼라 PICK" 영역이 보이도록 스크롤 후 캡쳐

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_URL = 'https://www.hmall.com/md/dpl/index';
const OUTPUT_DIR = path.join(__dirname, '쇼라PICK');

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

  // 초기 진입 시 뜰 수 있는 팝업 배너 처리 (있으면 닫고, 없으면 그냥 진행)
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

  // 상단 "모바일라이브" 탭 클릭 (실제 요소: data-rel="라이브")
  const liveTab = page.locator('a[data-rel="라이브"]');
  await liveTab.waitFor({ state: 'visible', timeout: 30000 });
  await liveTab.click();
  console.log('모바일라이브 탭 클릭 완료');

  // "쇼라 PICK" 영역(제목+상품 목록을 감싸는 전체 박스)이 나타날 때까지 대기
  const syoraPick = page.locator('div.as5dvo0').first();
  await syoraPick.waitFor({ state: 'visible', timeout: 30000 });
  console.log('쇼라 PICK 영역 확인');

  // 해당 영역이 화면 한가운데쯤 오도록 스크롤 (위로는 이전 콘텐츠, 아래로는 다시보쇼라까지 같이 보이게)
  await syoraPick.evaluate((el) => {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  // 스크롤 및 렌더링 안정화를 위한 대기
  await page.waitForTimeout(1000);

  const dateStr = getDateString();
  const outputPath = path.join(OUTPUT_DIR, `${dateStr}.png`);

  // 화면 전체(뷰포트) 캡쳐
  await page.screenshot({ path: outputPath });

  console.log(`캡쳐 완료: ${outputPath}`);

  await browser.close();
})().catch((err) => {
  console.error('캡쳐 중 오류 발생:', err);
  process.exit(1);
});
