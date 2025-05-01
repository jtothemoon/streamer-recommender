export const gameKeywords: { [key: string]: string[] } = {
  롤: ["롤 스트리머", "리그오브레전드 방송", "롤 유튜버"],
  배틀그라운드: ["배그 스트리머", "배틀그라운드 방송", "PUBG 유튜버"],
  발로란트: ["발로란트 스트리머", "발로 유튜버", "발로란트 방송"],
  마인크래프트: ["마크 스트리머", "마인크래프트 방송", "마크 유튜버"],
  로스트아크: ["로아 스트리머", "로스트아크 방송", "로아 유튜버"],
};

export const gameTypeToKeyword: { [key: string]: string } = {
  "롤": "롤",
  "배틀그라운드": "배틀그라운드",
  "발로란트": "발로란트",
  "마인크래프트": "마인크래프트",
  "로스트아크": "로스트아크",
};

export const gameDetectionKeywords: { [key: string]: string[] } = {
  "롤": ["롤", "리그오브레전드", "league of legends", "lol"],
  "배틀그라운드": ["배틀그라운드", "배그", "pubg", "배틀", "battlegrounds"],
  "발로란트": ["발로란트", "발로", "valorant"],
  "마인크래프트": ["마인크래프트", "마크", "minecraft"],
  "로스트아크": ["로스트아크", "로아", "lost ark"],
};

export const gameTypeToTwitchGameId: { [key: string]: string } = {
  "롤": "21779",
  "배틀그라운드": "493057",
  "발로란트": "516575",
  "마인크래프트": "27471",
  "로스트아크": "102007682",
};
