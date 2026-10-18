export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP-47 tag written to <html lang>. Chinese copy is Simplified. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

const en = {
  brand: {
    name: "Moonlit Sanctuary",
    tagline: "A quiet observatory for tarot and the Four Pillars.",
  },
  hero: {
    title: "Where the moon keeps its counsel",
  },
  language: {
    label: "Language",
    en: "English",
    zh: "中文",
  },
  world: {
    loading: "The sky is gathering",
    unavailable:
      "This sanctuary needs WebGL to render its 3D world. Your browser or device has it turned off or unsupported.",
    canvasLabel: "A moonlit celestial sanctuary",
    lost: "The 3D view was paused by your browser. Your reading is safe.",
    restore: "Restore 3D view",
  },
  footer: {
    disclaimer: "For reflection and entertainment — not a prediction.",
    about: "About & methods",
  },
  hint: "Move to explore · Click to enter",
  charms: {
    hint: "Some lights hide small secrets",
    progress: "{n} of {total} hidden lights found",
    allFound: "Every hidden light found",
    close: "Close message",
  },
  destinations: {
    navLabel: "Destinations",
    enter: "Enter",
    tarot: {
      name: "Tarot Garden",
      blurb: "Draw three cards beneath the moon gate.",
    },
    destiny: {
      name: "Destiny Palace",
      blurb: "Map your Four Pillars and Five Elements.",
    },
  },
  nav: {
    back: "Return to the sanctuary",
    backShort: "Sanctuary",
  },
  sound: {
    on: "Sound on",
    off: "Sound off",
    label: "Sound",
  },
  tarot: {
    deckLabel: "Major Arcana · 22 of 78 cards",
    choose: {
      title: "What would you like to reflect on?",
      categories: {
        love: { name: "Love", blurb: "Connection, closeness, and how you show up for others." },
        career: { name: "Career", blurb: "Work, purpose, and the paths in front of you." },
        self: { name: "Self-Discovery", blurb: "Inner patterns, growth, and what you need." },
      },
    },
    draw: {
      title: "Choose three cards from the fan",
      progress: "{n} of 3 chosen",
      drawForMe: "Draw a card for me",
    },
    reveal: {
      title: "Your spread is set",
      action: "Turn the {position} card",
      hint: "Or click the glowing card on the table.",
    },
    complete: {
      title: "All three cards are revealed",
      open: "Read the interpretation",
    },
    restart: "New reading",
    startOver: "Start over",
    positions: { past: "Past", present: "Present", future: "Future" },
    orientation: { upright: "Upright", reversed: "Reversed" },
    panel: {
      title: "Your reading",
      close: "Close reading",
      categoryLabel: "Question",
      keywords: "Keywords",
      reflect: "To reflect on",
      curatedNote: "Card meanings are curated summaries of traditional symbolism.",
    },
    unknownCard: "Unknown card",
  },
  destiny: {
    form: {
      title: "Your birth details",
      intro: "Your chart is calculated in your browser from a documented convention. Nothing is stored.",
      date: "Birth date",
      time: "Birth time",
      timeHint: "Local clock time at the birthplace.",
      unknownTime: "I don't know my birth time",
      unknownTimeHint: "We'll calculate three pillars and leave the hour pillar empty.",
      place: "Birthplace",
      placePlaceholder: "Choose a city",
      otherPlace: "Not listed — choose a time zone",
      timeZone: "Time zone",
      timeZonePlaceholder: "e.g. Europe/Lisbon",
      longitude: "Longitude (optional)",
      longitudeHint: "Degrees east; negative for west. Only used for the true-solar-time note.",
      fold: "This clock time happened twice that night (daylight saving ended). Which one?",
      foldEarlier: "The first time (daylight time)",
      foldLater: "The second time (standard time)",
      submit: "Calculate chart",
      regions: {
        china: "Greater China",
        asia: "Asia",
        europe: "Europe",
        americas: "Americas",
        oceania: "Oceania",
        africa: "Africa",
      },
    },
    errors: {
      date_required: "Enter your birth date.",
      date_invalid: "That date doesn't exist. Check the day and month.",
      date_out_of_range: "Charts are supported for births from 1900 onward.",
      date_in_future: "The birth date can't be in the future.",
      time_required: "Enter your birth time, or choose “I don't know my birth time”.",
      time_invalid: "Use a 24-hour time such as 08:30.",
      place_required: "Choose your birthplace, or a time zone if it isn't listed.",
      time_zone_invalid: "Choose a time zone from the list (for example Europe/Lisbon).",
      longitude_invalid: "Longitude must be a number between −180 and 180.",
      chart: {
        invalid_date: "That date can't be charted.",
        invalid_time: "That time can't be charted.",
        out_of_range: "Charts are supported for births between 1900 and 2100.",
        invalid_time_zone: "That time zone isn't recognized.",
        nonexistent_local_time:
          "That clock time didn't exist at the birthplace — clocks jumped forward for daylight saving. Check the time on the birth record.",
        ambiguous_local_time: "Choose which occurrence of this time you mean, then calculate again.",
      },
    },
    chart: {
      title: "Your Four Pillars",
      edit: "Edit birth details",
      pillars: { year: "Year", month: "Month", day: "Day", hour: "Hour" },
      hourUnknown: "Unknown",
      dayMaster: "Day Master",
      elements: "Five Elements tally",
      counted: "{n} visible characters counted",
      hidden: "Hidden stems",
      tenGod: "Ten God",
      self: "Self",
      ambiguous:
        "Your birth date falls on a solar-term change. Without a birth time, the {pillar} pillar could be {options}.",
      timeUnknownNote:
        "Without a birth time, the hour pillar is left empty. If you were born between 23:00 and 24:00, the day pillar under this convention would be the next day's.",
      dstNote: "Daylight saving was in effect; the chart uses standard time ({time}).",
      normalized: "Charted at {time} local standard time.",
      trueSolar:
        "True solar time at this longitude is about {minutes} min {direction} clock time. This chart does not apply it.",
      trueSolarAhead: "ahead of",
      trueSolarBehind: "behind",
      trueSolarDiffer: "Under the true-solar-time convention, your hour pillar would be different.",
      method: "How this is calculated",
      sizeNote:
        "In the sphere, each element's size follows this tally. It is a picture of the count, not of strength or fortune.",
      explore: "Select a pillar or element to read about it.",
      close: "Close",
      roles: { main: "main", middle: "middle", residual: "residual" },
      generates: "Generates",
      controls: "Controls",
      polarity: { yang: "Yang", yin: "Yin" },
    },
    elementNames: { wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water" },
  },
  ai: {
    heading: "A personal reflection",
    intro: "Generate a reflection written for this exact spread. It's symbolic, for contemplation — not a prediction.",
    introDestiny:
      "Generate a reflection on this exact chart. Your birth details are used only to recompute the chart on our server; the AI sees the pillars, not your date, time, or place.",
    generate: "Generate reflection",
    generating: "Listening to the stars…",
    retry: "Try again",
    themes: "Themes",
    questions: "Questions to sit with",
    suggestions: "Gentle suggestions",
    summary: "In one line",
    disclaimer: "Written by AI from the curated meanings above. Symbolic and for reflection only.",
    topic: "Focus",
    topics: { overview: "Overview", love: "Relationships", career: "Work & purpose", self: "Inner life" },
    open: "Open reflection",
    close: "Close reflection",
    errors: {
      invalid_request: "This reading couldn't be sent for reflection. Try starting it again.",
      payload_too_large: "This request was too large to send.",
      not_configured:
        "AI reflections aren't set up on this server. The curated meanings above are your complete reading.",
      rate_limited: "Too many requests just now. Wait a minute, then try again.",
      timeout: "The reflection took too long. Try again.",
      provider_error: "The reflection service had a problem. Try again in a moment.",
      invalid_output: "The reflection came back incomplete, so we didn't show it. Try again.",
      refused: "The AI declined to write this reflection. The curated meanings remain available.",
      network: "Couldn't reach the server. Check your connection and try again.",
      mismatch: "The reflection didn't match this reading, so we didn't show it. Try again.",
    },
  },
  share: {
    open: "Create share card",
    title: "Share card",
    tarotTitle: "A Moonlit Reading",
    destinyTitle: "My Four Pillars",
    destinySubtitle: "Chinese Bazi · Five Elements",
    destinyFallback: "A chart of stems and branches, read for reflection.",
    includeDate: "Include today's date",
    privacy: "Your birth date, time, and place are never included.",
    privacyTarot: "Only your cards and question area are included.",
    download: "Download image",
    share: "Share…",
    close: "Close",
    rendering: "Drawing your card…",
    failed: "The card couldn't be drawn. Try again.",
    alt: "Preview of your share card",
    footer: "For reflection, not prediction",
  },
  about: {
    rulesHeading: "The convention used here",
    rules: [
      "The year pillar changes at the exact moment of Lichun (立春), not at the lunar new year.",
      "The month pillar changes at the exact moment of each of the twelve Jie (节) solar terms.",
      "Solar terms are compared at the same absolute instant wherever you were born (they are computed in China Standard Time, UTC+8).",
      "Day and hour pillars use your birthplace's local standard time; any daylight-saving hour is removed.",
      "The day changes at 23:00 local standard time, the start of the Zi (子) hour.",
      "Hours are the twelve two-hour Shichen (时辰); each hour stem follows from the day stem.",
      "True solar time is not applied. When you give a birthplace, we show its estimated offset for information.",
      "If you don't know your birth time, only the year, month and day pillars are calculated. If a solar term falls on your birth date, we tell you which pillar is uncertain instead of guessing.",
      "The Five Elements tally simply counts the visible stems and each branch's principal element. It is not a strength (旺衰) analysis.",
    ],
    title: "About & methods",
    intro:
      "Moonlit Sanctuary is a space for symbolic reflection. Nothing here predicts the future, and nothing here is advice about health, money, or relationships.",
    sections: [
      {
        heading: "Tarot",
        anchor: "tarot",
        body: [
          "Readings use the 22 cards of the Major Arcana — a partial deck; the 56 Minor Arcana are not included yet. Cards are drawn without replacement, so a card can appear only once per spread, and each card is upright or reversed with equal chance.",
          "All card artwork is original to this project. Card meanings are curated, original summaries of widely shared tarot symbolism.",
        ],
      },
      {
        heading: "Chinese Four Pillars (八字)",
        anchor: "bazi",
        body: [
          "Charts are calculated in your browser with the open-source tyme4ts library (MIT), whose solar-term times come from the ShouXing astronomical algorithms. We checked its 240 solar-term instants for 2019–2028 against the Hong Kong Observatory's published table; every one agrees to within a minute.",
          "This site follows one explicit convention, listed below. Other schools differ — for example on true solar time or on when the day changes around midnight — and may produce a different chart.",
        ],
      },
      {
        heading: "Your data",
        anchor: "data",
        body: [
          "Birth details you enter stay in your browser except when you ask for a chart interpretation; then they are sent to this site's server only to recompute your chart, and are not stored or logged.",
          "Language choice is saved in your browser. Sound is always off until you turn it on.",
        ],
      },
    ],
  },
};

export type Dictionary = typeof en;

const zh: Dictionary = {
  brand: {
    name: "月影圣所",
    tagline: "一座静谧的观星台，聆听塔罗与八字。",
  },
  hero: {
    title: "月光守候着它的箴言",
  },
  language: {
    label: "语言",
    en: "English",
    zh: "中文",
  },
  world: {
    loading: "星空正在汇聚",
    unavailable: "此圣所需要 WebGL 来呈现 3D 世界，你的浏览器或设备当前未启用或不支持。",
    canvasLabel: "月光下的天穹圣所",
    lost: "浏览器暂停了 3D 画面。你的解读不会丢失。",
    restore: "恢复 3D 画面",
  },
  footer: {
    disclaimer: "仅供自我反思与娱乐，并非预言。",
    about: "关于与方法",
  },
  hint: "移动鼠标探索 · 点击进入",
  charms: {
    hint: "有些光里，藏着小秘密",
    progress: "已发现 {n}/{total} 盏藏起来的光",
    allFound: "所有藏起来的光都被你找到了",
    close: "关闭",
  },
  destinations: {
    navLabel: "目的地",
    enter: "进入",
    tarot: {
      name: "塔罗花园",
      blurb: "在月门之下抽取三张牌。",
    },
    destiny: {
      name: "命运宫",
      blurb: "排出你的四柱八字与五行。",
    },
  },
  nav: {
    back: "返回圣所",
    backShort: "圣所",
  },
  sound: {
    on: "声音开启",
    off: "声音关闭",
    label: "声音",
  },
  tarot: {
    deckLabel: "大阿卡那 · 共 78 张中的 22 张",
    choose: {
      title: "你想就哪方面进行反思？",
      categories: {
        love: { name: "感情", blurb: "关系、亲密，以及你如何对待身边的人。" },
        career: { name: "事业", blurb: "工作、意义，以及摆在你面前的道路。" },
        self: { name: "自我探索", blurb: "内在的模式、成长，以及你真正需要的东西。" },
      },
    },
    draw: {
      title: "从扇形牌阵中选出三张牌",
      progress: "已选 {n} / 3",
      drawForMe: "帮我抽一张",
    },
    reveal: {
      title: "牌阵已经就位",
      action: "翻开「{position}」牌",
      hint: "也可以点击桌上发光的那张牌。",
    },
    complete: {
      title: "三张牌都已翻开",
      open: "查看解读",
    },
    restart: "重新占卜",
    startOver: "重新开始",
    positions: { past: "过去", present: "现在", future: "未来" },
    orientation: { upright: "正位", reversed: "逆位" },
    panel: {
      title: "你的解读",
      close: "关闭解读",
      categoryLabel: "问题",
      keywords: "关键词",
      reflect: "值得思考",
      curatedNote: "牌义为对传统象征的整理摘要。",
    },
    unknownCard: "未知的牌",
  },
  destiny: {
    form: {
      title: "你的出生信息",
      intro: "命盘依据公开说明的规则在你的浏览器中计算，不会保存任何信息。",
      date: "出生日期",
      time: "出生时间",
      timeHint: "出生地当时的钟表时间。",
      unknownTime: "我不知道出生时间",
      unknownTimeHint: "将只排出年、月、日三柱，时柱留空。",
      place: "出生地",
      placePlaceholder: "选择城市",
      otherPlace: "列表中没有——选择时区",
      timeZone: "时区",
      timeZonePlaceholder: "例如 Europe/Lisbon",
      longitude: "经度（可选）",
      longitudeHint: "东经为正，西经为负。仅用于真太阳时提示。",
      fold: "这个钟表时间在当晚出现了两次（夏令时结束）。你指的是哪一次？",
      foldEarlier: "第一次（夏令时）",
      foldLater: "第二次（标准时间）",
      submit: "排盘",
      regions: {
        china: "大中华地区",
        asia: "亚洲",
        europe: "欧洲",
        americas: "美洲",
        oceania: "大洋洲",
        africa: "非洲",
      },
    },
    errors: {
      date_required: "请填写出生日期。",
      date_invalid: "这个日期不存在，请检查日与月。",
      date_out_of_range: "仅支持 1900 年及以后出生的命盘。",
      date_in_future: "出生日期不能晚于今天。",
      time_required: "请填写出生时间，或勾选“我不知道出生时间”。",
      time_invalid: "请使用 24 小时制时间，例如 08:30。",
      place_required: "请选择出生地；如不在列表中，请选择时区。",
      time_zone_invalid: "请从列表中选择时区（例如 Europe/Lisbon）。",
      longitude_invalid: "经度必须是 −180 到 180 之间的数字。",
      chart: {
        invalid_date: "无法为这个日期排盘。",
        invalid_time: "无法为这个时间排盘。",
        out_of_range: "仅支持 1900 至 2100 年间出生的命盘。",
        invalid_time_zone: "无法识别这个时区。",
        nonexistent_local_time:
          "出生地当时不存在这个钟表时间——夏令时开始时时钟向前拨了一小时。请核对出生记录上的时间。",
        ambiguous_local_time: "请选择你指的是哪一次出现的时间，然后重新排盘。",
      },
    },
    chart: {
      title: "你的四柱",
      edit: "修改出生信息",
      pillars: { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" },
      hourUnknown: "未知",
      dayMaster: "日主",
      elements: "五行计数",
      counted: "共计 {n} 个可见字",
      hidden: "藏干",
      tenGod: "十神",
      self: "日主",
      ambiguous: "你的出生日期恰逢节气交替。没有出生时间时，{pillar}可能是 {options}。",
      timeUnknownNote: "没有出生时间时，时柱留空。若你出生于 23:00 至 24:00 之间，按本规则日柱应为次日。",
      dstNote: "当时实行夏令时，命盘使用标准时间（{time}）。",
      normalized: "按当地标准时间 {time} 排盘。",
      trueSolar: "此经度的真太阳时约比钟表时间{direction} {minutes} 分钟。本命盘未采用真太阳时。",
      trueSolarAhead: "早",
      trueSolarBehind: "晚",
      trueSolarDiffer: "若采用真太阳时，你的时柱会有所不同。",
      method: "计算方法说明",
      sizeNote: "在天球中，各元素的大小对应这里的计数。它只是数量的呈现，并不代表强弱或运势。",
      explore: "选择一柱或一种元素，查看说明。",
      close: "关闭",
      roles: { main: "本气", middle: "中气", residual: "余气" },
      generates: "生",
      controls: "克",
      polarity: { yang: "阳", yin: "阴" },
    },
    elementNames: { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" },
  },
  ai: {
    heading: "专属反思",
    intro: "为这组牌生成一段专属的反思文字。它是象征性的，用于静心思考，并非预言。",
    introDestiny:
      "为这份命盘生成一段反思。你的出生信息只用于在我们的服务器上重新排盘；AI 看到的是四柱，而不是你的出生日期、时间或地点。",
    generate: "生成反思",
    generating: "正在聆听星辰……",
    retry: "重试",
    themes: "主题",
    questions: "值得思考的问题",
    suggestions: "温和的建议",
    summary: "一句话总结",
    disclaimer: "由 AI 依据上方整理的牌义撰写，仅为象征性的反思。",
    topic: "关注方向",
    topics: { overview: "整体", love: "人际与感情", career: "工作与意义", self: "内在生活" },
    open: "查看反思",
    close: "关闭反思",
    errors: {
      invalid_request: "这次解读无法发送，请重新开始一次。",
      payload_too_large: "请求内容过大，无法发送。",
      not_configured: "本服务器尚未启用 AI 反思。上方整理的牌义就是你完整的解读。",
      rate_limited: "请求过于频繁，请稍等一分钟再试。",
      timeout: "生成时间过长，请重试。",
      provider_error: "反思服务出现问题，请稍后再试。",
      invalid_output: "返回的内容不完整，因此没有显示。请重试。",
      refused: "AI 没有生成这段反思。整理好的牌义仍可查看。",
      network: "无法连接服务器，请检查网络后重试。",
      mismatch: "返回的反思与当前解读不符，因此没有显示。请重试。",
    },
  },
  share: {
    open: "生成分享卡片",
    title: "分享卡片",
    tarotTitle: "月光下的占卜",
    destinyTitle: "我的四柱",
    destinySubtitle: "八字 · 五行",
    destinyFallback: "一份由天干地支组成的命盘，用于静心反思。",
    includeDate: "显示今天的日期",
    privacy: "卡片绝不包含你的出生日期、时间或地点。",
    privacyTarot: "卡片只包含你的牌与问题方向。",
    download: "下载图片",
    share: "分享…",
    close: "关闭",
    rendering: "正在绘制卡片……",
    failed: "卡片绘制失败，请重试。",
    alt: "分享卡片预览",
    footer: "用于反思，而非预言",
  },
  about: {
    rulesHeading: "本站采用的规则",
    rules: [
      "年柱以立春交节的精确时刻为界，而不是农历新年。",
      "月柱以十二个“节”交节的精确时刻为界。",
      "无论出生于何地，节气都按同一绝对时刻比较（节气时刻以北京时间 UTC+8 计算）。",
      "日柱与时柱采用出生地的当地标准时间，并扣除夏令时。",
      "按当地标准时间 23:00（子时开始）换日。",
      "时柱按十二时辰划分，时干由日干推出（五鼠遁）。",
      "不采用真太阳时。若提供出生地，会显示其估算的时差供参考。",
      "若不知道出生时间，只排年、月、日三柱；若出生当日恰逢交节，会说明哪一柱无法确定，而不是随意猜测。",
      "五行计数只统计可见的天干与各地支的本气五行，并非旺衰分析。",
    ],
    title: "关于与方法",
    intro: "月影圣所是一个用于象征性自我反思的空间。这里的一切都不预测未来，也不构成任何健康、财务或感情方面的建议。",
    sections: [
      {
        heading: "塔罗",
        anchor: "tarot",
        body: [
          "解读使用大阿卡那的 22 张牌——这是一副不完整的牌组，暂未包含 56 张小阿卡那。抽牌不放回，同一张牌在一次牌阵中只会出现一次；每张牌正位或逆位的概率相同。",
          "所有牌面插画均为本项目原创。牌义为对广泛流传的塔罗象征所作的原创整理。",
        ],
      },
      {
        heading: "四柱八字",
        anchor: "bazi",
        body: [
          "命盘在你的浏览器中使用开源库 tyme4ts（MIT 许可）计算，其节气时刻来自寿星天文历算法。我们将 2019–2028 年的 240 个节气时刻与香港天文台公布的数据逐一核对，全部相差不超过一分钟。",
          "本站遵循下列唯一且明确的规则。不同流派的做法有所不同——例如是否采用真太阳时、子时如何换日——因此可能排出不同的命盘。",
        ],
      },
      {
        heading: "你的数据",
        anchor: "data",
        body: [
          "你输入的出生信息只保存在你的浏览器中；只有在你请求命盘解读时，才会发送到本站服务器，仅用于重新排盘，不会被存储或记录。",
          "语言选择会保存在你的浏览器中。声音默认关闭，需要你手动开启。",
        ],
      },
    ],
  },
};

export const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

/** Replaces `{name}` placeholders. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Picks a supported locale from the browser's preference list. */
export function resolveLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
