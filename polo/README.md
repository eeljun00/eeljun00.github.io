# Polo Ralph Lauren 리디자인

이준화의 디자인 포트폴리오를 위한 정적 웹사이트입니다. 별도의 설치나 빌드 없이 HTML, CSS, JavaScript로 실행됩니다.

## 실행

포트폴리오 루트에서 로컬 정적 서버를 실행하고 `/polo/`를 엽니다. VS Code의 Live Server 등 정적 서버를 사용할 수 있습니다.

## GitHub Pages

기존 포트폴리오와 함께 `polo` 폴더 전체를 업로드하면 `/polo/` 경로에서 열립니다. 모든 이미지, 아이콘, 글꼴은 상대 경로로 연결했습니다. 기존 `html/sub3.html`의 ‘사이트 보러가기’에서도 접근할 수 있습니다.

## 구성

- `index.html`: 의미 구조, 섹션, 접근성 레이블
- `style.css`: 1920px Figma 프레임 기준 레이아웃, 900px 이하 반응형 구성
- `script.js`: 검색, 상품 상세, 자수 색상 선택, 위시리스트, 쇼핑백, 모바일 메뉴, 스크롤
- `assets/`: Figma 원본과 추가 이미지, SVG 아이콘
- `assets/fonts/`: Eulyoo1945 Regular 및 SemiBold

1920px 디자인을 기준으로 하며, 데스크톱에서는 화면 높이에 맞춰 커스텀과 액세서리 영역을 조정합니다. 작은 화면은 콘텐츠를 재배치합니다. 데스크톱 휠 스크롤은 기존 포트폴리오의 보간 방식을 재사용하며, 움직임 줄이기 설정·터치·키보드·중첩 스크롤을 지원합니다. 상품과 컬렉션 이미지는 클릭해도 상세 창을 열지 않습니다.

검색·위시리스트·쇼핑백은 현재 페이지 메모리에서 동작합니다. 새로고침하면 초기화됩니다. 실제 회원가입, 결제, 예약 접수, 뉴스레터 발송은 연결되어 있지 않습니다. 해당 서비스는 공식 사이트 안내로 연결됩니다.

## 원본 및 출처

- [Figma 디자인 — 폴로_1920, 1:19007](https://www.figma.com/design/uwlKkOaaMTumuTD2LVbTBm/?node-id=1-19007)
- 이미지 및 브랜드 요소: 제공받은 Figma 디자인. 각 권리는 해당 권리자에게 있습니다.
- 글꼴: 을유문화사 Eulyoo1945, Regular 400 / SemiBold 600. Copyright © 2020 by Eulyoo Publishing Co. All rights reserved.
- [을유문화사 글꼴 안내](https://www.eulyoo.co.kr/member/font.html)
- [웹폰트 배포 출처](https://github.com/0xd669/eulyoo1945)

이 페이지는 Ralph Lauren의 공식 웹사이트가 아닙니다.
