import { allergyAssets, categoryAssets, tagAssets } from "./assets";

export type PickItem = {
  id: string;
  label: string;
  description: string;
  image: string;
};

export const categories: PickItem[] = [
  { id: "korean", label: "한식", description: "찌개, 비빔밥, 백반", image: categoryAssets.korean },
  { id: "chinese", label: "중식", description: "면, 볶음, 매콤한 한 그릇", image: categoryAssets.chinese },
  { id: "western", label: "양식", description: "파스타, 스테이크, 샐러드", image: categoryAssets.western },
  { id: "japanese", label: "일식", description: "초밥, 라멘, 덮밥", image: categoryAssets.japanese },
  { id: "asian", label: "아시안", description: "쌀국수, 커리, 향신료", image: categoryAssets.asian },
  { id: "meat", label: "고기", description: "구이, 바비큐, 든든한 식사", image: categoryAssets.meat },
  { id: "fastfood", label: "패스트푸드", description: "버거, 치킨, 빠른 선택", image: categoryAssets.fastfood }
];

export const tags: PickItem[] = [
  { id: "grilled", label: "구이", description: "불맛과 담백함", image: tagAssets.grilled },
  { id: "soup", label: "국물", description: "따뜻하고 촉촉한 식사", image: tagAssets.soup },
  { id: "braised", label: "조림", description: "진하게 졸인 메뉴", image: tagAssets.braised },
  { id: "steamed", label: "찜", description: "부드러운 조리 방식", image: tagAssets.steamed },
  { id: "boiled", label: "삶음", description: "담백하게 익힌 메뉴", image: tagAssets.boiled },
  { id: "stirfried", label: "볶음", description: "진한 양념과 풍미", image: tagAssets.stirfried },
  { id: "fried", label: "튀김", description: "바삭한 식감", image: tagAssets.fried },
  { id: "raw", label: "날것", description: "회와 생식 메뉴", image: tagAssets.raw },
  { id: "spicy", label: "매운맛", description: "칼칼한 메뉴 선호", image: tagAssets.spicy }
];

export const allergies: PickItem[] = [
  { id: "egg", label: "알류", description: "계란 포함", image: allergyAssets.egg },
  { id: "milk", label: "우유", description: "유제품 제한", image: allergyAssets.milk },
  { id: "buckwheat", label: "메밀", description: "메밀 포함", image: allergyAssets.buckwheat },
  { id: "peanut", label: "땅콩", description: "견과류 제한", image: allergyAssets.peanut },
  { id: "soy", label: "대두", description: "콩류 포함", image: allergyAssets.soy },
  { id: "wheat", label: "밀", description: "글루텐 확인", image: allergyAssets.wheat },
  { id: "shrimp", label: "새우", description: "갑각류 포함", image: allergyAssets.shrimp },
  { id: "crab", label: "게", description: "갑각류 포함", image: allergyAssets.crab },
  { id: "mackerel", label: "고등어", description: "등푸른생선", image: allergyAssets.mackerel },
  { id: "squid", label: "오징어", description: "연체류 포함", image: allergyAssets.squid },
  { id: "shellfish", label: "조개류", description: "패류 포함", image: allergyAssets.shellfish },
  { id: "peach", label: "복숭아", description: "과일 알러지", image: allergyAssets.peach },
  { id: "tomato", label: "토마토", description: "토마토 포함", image: allergyAssets.tomato },
  { id: "pork", label: "돼지고기", description: "돼지고기 제한", image: allergyAssets.pork },
  { id: "chicken", label: "닭고기", description: "닭고기 제한", image: allergyAssets.chicken },
  { id: "beef", label: "소고기", description: "소고기 제한", image: allergyAssets.beef },
  { id: "walnut", label: "호두", description: "견과류 포함", image: allergyAssets.walnut },
  { id: "pineNut", label: "잣", description: "견과류 포함", image: allergyAssets.pineNut },
  { id: "sulfites", label: "아황산류", description: "보존료 확인", image: allergyAssets.sulfites }
];

export const recommendations = [
  {
    rank: 1,
    menu: "김치찌개",
    score: 92,
    category: "한식",
    reason: "한식 선호도와 매운맛 태그가 높고, 최근 식사 기록과 겹치지 않습니다."
  },
  {
    rank: 2,
    menu: "마제소바",
    score: 86,
    category: "일식",
    reason: "면류와 새로운 메뉴 시도 조건에 잘 맞는 후보입니다."
  },
  {
    rank: 3,
    menu: "쌀국수",
    score: 81,
    category: "아시안",
    reason: "가벼운 식사 목적에 적합하고 호불호가 적은 메뉴입니다."
  }
];

export const meetings = [
  {
    title: "프로젝트 팀 저녁",
    status: "추천 준비",
    time: "오늘 18:30",
    place: "문지캠퍼스 근처",
    members: ["지호", "기환", "게스트1"]
  },
  {
    title: "주말 점심 모임",
    status: "참여자 입력 중",
    time: "토요일 12:00",
    place: "둔산동",
    members: ["지호", "민서"]
  }
];

export const histories = [
  { date: "07.03", menu: "비빔밥", memo: "점심, 만족도 5" },
  { date: "07.02", menu: "돈카츠", memo: "저녁, 새로운 메뉴" },
  { date: "07.01", menu: "쌀국수", memo: "팀 식사" }
];
