# 캠핑고고 6시간 콘텐츠 개선 데몬 런북 (Content Daemon Runbook)

## 1. 개요
캠핑고고(`campgogo.kr`)의 검색엔진(구글, 네이버, 빙) 색인 극대화 및 사이트 신선도(Freshness) 유지를 위해 **6시간마다 자동으로 실행되는 콘텐츠 개선 데몬**입니다.

- **실행 주기**: 매 6시간 (00:00, 06:00, 12:00, 18:00 UTC / 09:00, 15:00, 21:00, 03:00 KST)
- **작업 파이프라인**:
  1. `blog-drafts/` 내 443개 고품질 초안 중 미발행 글 1~2편 자동 선별 및 `blog_posts`에 `published` 등록
  2. 신규 발행 URL을 **IndexNow API**로 즉시 제출 (Bing, 네이버 등 즉각 크롤링 유도)
  3. **Google Search Console API**로 `sitemap.xml`, `sitemap-blog.xml`, `sitemap-campsites.xml` 자동 재제출 (Ping)
  4. 야영지 데이터 정제: 가격이 없는데 '무료'로 잘못 표기된 데이터 정상화 (`is_free=0`) 및 시설 키워드 기반 테마 태깅
  5. 실행 로그 저장 (`.logs/content-daemon-log.json`)

---

## 2. 실행 방법

### 방법 A: GitHub Actions (기본 자동 실행)
- `.github/workflows/content-daemon.yml`에 의해 매 6시간마다 자동으로 실행됩니다.
- GitHub 저장소의 `Actions` 탭에서 `6-Hour Content Improvement Daemon`을 선택하여 `Run workflow`로 수동 즉시 실행도 가능합니다.

### 방법 B: 수동 로컬/서버 실행 (Bun 또는 Node.js)
```bash
# 1) 테스트 실행 (실제 DB 쓰기/API 전송 없음)
bun scripts/content-daemon.ts --dry-run

# 2) 실제 1회 실행 (1편 발행 및 색인 요청)
bun scripts/content-daemon.ts

# 3) 2편 이상 발행 옵션
bun scripts/content-daemon.ts --batch=2
```

### 방법 C: Contabo VPS 서버 Crontab 등록 (선택)
서버 호스트의 crontab에 직접 등록하여 완전히 독립적으로 구동할 경우:
```bash
# crontab -e
0 */6 * * * cd /opt/im-cloud/apps/campgogo && bun scripts/content-daemon.ts >> /var/log/campgogo-daemon.log 2>&1
```

---

## 3. 사이트맵 및 SEO 개선 사항 요약
- `src/app/sitemap.xml`: `sitemap-campsites.xml` 누락 수정 및 추가 완료
- `src/app/sitemap-campsites.xml`: 국공립만 필터링되던 `isPublic` 조건 제거 (전체 8,000개 야영지 색인 복구)
- `src/app/sitemap-static.xml`: 17개 시/도, 12개 월별 시즌, 7개 주요 테마 허브 URL 정규 추가 완료
