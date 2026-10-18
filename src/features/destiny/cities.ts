import type { LocalizedText } from "@/lib/i18n/types";

export type Region = "china" | "asia" | "europe" | "americas" | "oceania" | "africa";

export interface City {
  id: string;
  name: LocalizedText;
  region: Region;
  timeZone: string;
  /** Degrees east. Used only for the informational true-solar-time note. */
  longitude: number;
}

const c = (id: string, en: string, zh: string, region: Region, timeZone: string, longitude: number): City => ({
  id,
  name: { en, zh },
  region,
  timeZone,
  longitude,
});

/** Curated birthplaces. Anyone else can choose a time zone directly. */
export const CITIES: readonly City[] = [
  c("beijing", "Beijing", "北京", "china", "Asia/Shanghai", 116.41),
  c("shanghai", "Shanghai", "上海", "china", "Asia/Shanghai", 121.47),
  c("guangzhou", "Guangzhou", "广州", "china", "Asia/Shanghai", 113.26),
  c("shenzhen", "Shenzhen", "深圳", "china", "Asia/Shanghai", 114.06),
  c("chengdu", "Chengdu", "成都", "china", "Asia/Shanghai", 104.07),
  c("chongqing", "Chongqing", "重庆", "china", "Asia/Shanghai", 106.55),
  c("hangzhou", "Hangzhou", "杭州", "china", "Asia/Shanghai", 120.16),
  c("nanjing", "Nanjing", "南京", "china", "Asia/Shanghai", 118.8),
  c("wuhan", "Wuhan", "武汉", "china", "Asia/Shanghai", 114.31),
  c("xian", "Xi’an", "西安", "china", "Asia/Shanghai", 108.94),
  c("tianjin", "Tianjin", "天津", "china", "Asia/Shanghai", 117.2),
  c("changsha", "Changsha", "长沙", "china", "Asia/Shanghai", 112.94),
  c("zhengzhou", "Zhengzhou", "郑州", "china", "Asia/Shanghai", 113.63),
  c("qingdao", "Qingdao", "青岛", "china", "Asia/Shanghai", 120.38),
  c("xiamen", "Xiamen", "厦门", "china", "Asia/Shanghai", 118.09),
  c("kunming", "Kunming", "昆明", "china", "Asia/Shanghai", 102.83),
  c("shenyang", "Shenyang", "沈阳", "china", "Asia/Shanghai", 123.43),
  c("harbin", "Harbin", "哈尔滨", "china", "Asia/Shanghai", 126.53),
  c("urumqi", "Ürümqi", "乌鲁木齐", "china", "Asia/Shanghai", 87.62),
  c("lhasa", "Lhasa", "拉萨", "china", "Asia/Shanghai", 91.13),
  c("hongkong", "Hong Kong", "香港", "china", "Asia/Hong_Kong", 114.17),
  c("macau", "Macau", "澳门", "china", "Asia/Macau", 113.54),
  c("taipei", "Taipei", "台北", "china", "Asia/Taipei", 121.56),
  c("kaohsiung", "Kaohsiung", "高雄", "china", "Asia/Taipei", 120.31),
  c("singapore", "Singapore", "新加坡", "asia", "Asia/Singapore", 103.82),
  c("kualalumpur", "Kuala Lumpur", "吉隆坡", "asia", "Asia/Kuala_Lumpur", 101.69),
  c("tokyo", "Tokyo", "东京", "asia", "Asia/Tokyo", 139.69),
  c("seoul", "Seoul", "首尔", "asia", "Asia/Seoul", 126.98),
  c("bangkok", "Bangkok", "曼谷", "asia", "Asia/Bangkok", 100.5),
  c("jakarta", "Jakarta", "雅加达", "asia", "Asia/Jakarta", 106.85),
  c("manila", "Manila", "马尼拉", "asia", "Asia/Manila", 120.98),
  c("hanoi", "Hanoi", "河内", "asia", "Asia/Bangkok", 105.85),
  c("hochiminh", "Ho Chi Minh City", "胡志明市", "asia", "Asia/Ho_Chi_Minh", 106.63),
  c("delhi", "Delhi", "德里", "asia", "Asia/Kolkata", 77.21),
  c("mumbai", "Mumbai", "孟买", "asia", "Asia/Kolkata", 72.88),
  c("dubai", "Dubai", "迪拜", "asia", "Asia/Dubai", 55.27),
  c("london", "London", "伦敦", "europe", "Europe/London", -0.13),
  c("paris", "Paris", "巴黎", "europe", "Europe/Paris", 2.35),
  c("berlin", "Berlin", "柏林", "europe", "Europe/Berlin", 13.4),
  c("madrid", "Madrid", "马德里", "europe", "Europe/Madrid", -3.7),
  c("rome", "Rome", "罗马", "europe", "Europe/Rome", 12.5),
  c("amsterdam", "Amsterdam", "阿姆斯特丹", "europe", "Europe/Amsterdam", 4.9),
  c("istanbul", "Istanbul", "伊斯坦布尔", "europe", "Europe/Istanbul", 28.98),
  c("moscow", "Moscow", "莫斯科", "europe", "Europe/Moscow", 37.62),
  c("newyork", "New York", "纽约", "americas", "America/New_York", -74.01),
  c("toronto", "Toronto", "多伦多", "americas", "America/Toronto", -79.38),
  c("chicago", "Chicago", "芝加哥", "americas", "America/Chicago", -87.63),
  c("losangeles", "Los Angeles", "洛杉矶", "americas", "America/Los_Angeles", -118.24),
  c("sanfrancisco", "San Francisco", "旧金山", "americas", "America/Los_Angeles", -122.42),
  c("seattle", "Seattle", "西雅图", "americas", "America/Los_Angeles", -122.33),
  c("vancouver", "Vancouver", "温哥华", "americas", "America/Vancouver", -123.12),
  c("mexicocity", "Mexico City", "墨西哥城", "americas", "America/Mexico_City", -99.13),
  c("saopaulo", "São Paulo", "圣保罗", "americas", "America/Sao_Paulo", -46.63),
  c("buenosaires", "Buenos Aires", "布宜诺斯艾利斯", "americas", "America/Argentina/Buenos_Aires", -58.38),
  c("sydney", "Sydney", "悉尼", "oceania", "Australia/Sydney", 151.21),
  c("melbourne", "Melbourne", "墨尔本", "oceania", "Australia/Melbourne", 144.96),
  c("auckland", "Auckland", "奥克兰", "oceania", "Pacific/Auckland", 174.76),
  c("cairo", "Cairo", "开罗", "africa", "Africa/Cairo", 31.24),
  c("lagos", "Lagos", "拉各斯", "africa", "Africa/Lagos", 3.38),
  c("nairobi", "Nairobi", "内罗毕", "africa", "Africa/Nairobi", 36.82),
  c("johannesburg", "Johannesburg", "约翰内斯堡", "africa", "Africa/Johannesburg", 28.05),
];

export const REGIONS: readonly Region[] = ["china", "asia", "europe", "americas", "oceania", "africa"];

export function getCity(id: string): City | undefined {
  return CITIES.find((x) => x.id === id);
}
