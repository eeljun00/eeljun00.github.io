AOS.init({
  once: true,
});

// 헤더 스크롤 감지
let lastScroll = 0;

$(window).on("scroll", function () {
  const currentScroll = $(this).scrollTop();

  // 1. 맨 위 → 무조건 보이기
  if (currentScroll === 0) {
    $("header").removeClass("hide");
  }

  // 2. 아래로 스크롤 → 숨김
  else if (currentScroll > lastScroll) {
    $("header").addClass("hide");
  }

  // 3. 위로 스크롤 → 보이기
  else {
    $("header").removeClass("hide");
  }

  lastScroll = currentScroll;
});
