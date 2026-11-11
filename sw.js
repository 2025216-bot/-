// ==========================================
// SmartAgri PWA 서비스 워커 (sw.js)
// ==========================================

// 1. 캐시 저장소 이름 및 오프라인 저장 대상 파일 목록
const CACHE_NAME = 'smartagri-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 2. 서비스 워커 설치 (Install Event)
// 앱이 처음 로드될 때 핵심 자원(HTML, JSON, 아이콘)을 캐시에 미리 저장합니다.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] SmartAgri 캐시 파일 저장 중...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // 새 서비스 워커가 대기 없이 즉시 활성화되도록 설정
});

// 3. 서비스 워커 활성화 (Activate Event)
// 캐시 버전이 변경되었을 때 이전 버전의 구형 캐시를 자동으로 정리합니다.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[Service Worker] 구버전 캐시 삭제:', key);
          return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // 서비스 워커가 페이지를 즉시 제어하도록 설정
});

// 4. 네트워크 요청 처리 (Fetch Event)
// 네트워크 우선 전략: 인터넷 연결 시 최신 파일 로드, 실패 시(오프라인) 캐시 파일 반환
self.addEventListener('fetch', (e) => {
  // 구글 앱 스크립트(GAS) 메모 전송 등 GET 이외의 요청(POST)은 캐싱 대상에서 제외
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // 서버에서 정상적으로 응답을 받으면 캐시 저장소에 복사본을 갱신합니다.
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseCopy));
        return response;
      })
      .catch(() => {
        // 오프라인이거나 네트워크 오류 발생 시 미리 캐싱해둔 오프라인 리소스를 제공합니다.
        return caches.match(e.request);
      })
  );
});
