/**
 * Curated, bilingual reference notes for the Bazi (八字) exploration feature.
 *
 * Bazi is presented as a traditional symbolic system for reflection and
 * entertainment. These notes describe traditional imagery and associations;
 * they are not predictions and make no factual claims about a person's life.
 */
import type { LocalizedText } from "@/lib/i18n/types";
import type { ElementId, TenGod } from "./symbols";
import type { PillarKey } from "./types";

export interface ElementNote {
  readonly name: LocalizedText;
  readonly qualities: LocalizedText;
  /** The phase this one feeds in the generating cycle (相生). */
  readonly generates: ElementId;
  /** The phase this one restrains in the controlling cycle (相克). */
  readonly controls: ElementId;
}

export interface StemNote {
  readonly image: LocalizedText;
  readonly note: LocalizedText;
}

export interface BranchNote {
  readonly season: LocalizedText;
  /** Two-hour period (时辰) in local standard time, e.g. "23:00–01:00". */
  readonly hours: string;
  readonly note: LocalizedText;
}

export interface TenGodNote {
  readonly name: LocalizedText;
  readonly relation: LocalizedText;
  readonly note: LocalizedText;
}

export interface PillarNote {
  readonly name: LocalizedText;
  readonly note: LocalizedText;
}

export const ELEMENT_NOTES: Readonly<Record<ElementId, ElementNote>> = {
  wood: {
    name: { en: "Wood", zh: "木" },
    qualities: {
      en: "Wood is linked with spring, the east and the colour green, and its imagery is of growth that reaches upward and outward. It is often read as a temperament of kindness, flexibility and steady aspiration.",
      zh: "木对应春季、东方与青绿色，意象是向上舒展、向外生长的生机。传统上常以仁厚、柔韧和不断进取来形容木的气质。",
    },
    generates: "fire",
    controls: "earth",
  },
  fire: {
    name: { en: "Fire", zh: "火" },
    qualities: {
      en: "Fire belongs to summer, the south and the colour red, carrying images of warmth, light and rising energy. Its traditional temperament is one of enthusiasm, courtesy and clarity.",
      zh: "火对应夏季、南方与红色，带着温暖、光明与上升的意象。传统上把热情、礼节与明朗视为火的性情。",
    },
    generates: "earth",
    controls: "metal",
  },
  earth: {
    name: { en: "Earth", zh: "土" },
    qualities: {
      en: "Earth sits at the centre and is tied to the turning points between seasons and the colour yellow. Its imagery is of holding, nourishing and keeping things steady, often read as reliability and good faith.",
      zh: "土居中央，对应四季交替之际与黄色，意象是承载、滋养与稳定。传统上常以敦厚、守信来描绘土的品性。",
    },
    generates: "metal",
    controls: "water",
  },
  metal: {
    name: { en: "Metal", zh: "金" },
    qualities: {
      en: "Metal is associated with autumn, the west and the colour white, evoking harvest, refinement and clear edges. Its traditional temperament is one of principle, decisiveness and a sense of what is fitting.",
      zh: "金对应秋季、西方与白色，令人联想到收成、精炼与分明的棱角。传统上以重义、果断与讲求分寸来形容金的气质。",
    },
    generates: "water",
    controls: "wood",
  },
  water: {
    name: { en: "Water", zh: "水" },
    qualities: {
      en: "Water belongs to winter, the north and the colour black or deep blue, with images of stillness, depth and quiet movement. It is traditionally read as a temperament of wisdom, adaptability and reflection.",
      zh: "水对应冬季、北方与玄黑色，意象是沉静、深邃与悄然流动。传统上把智慧、灵活与善于内省视为水的性情。",
    },
    generates: "wood",
    controls: "fire",
  },
};

export const STEM_NOTES: Readonly<Record<string, StemNote>> = {
  甲: {
    image: { en: "A tall, upright tree", zh: "参天大树" },
    note: {
      en: "The tall tree suggests a character that grows straight toward the light and offers shelter to others along the way.",
      zh: "大树挺拔向阳，象征一种正直生长、也愿意为身边人遮风挡雨的品格。",
    },
  },
  乙: {
    image: { en: "Vines, flowers and grasses", zh: "花草藤蔓" },
    note: {
      en: "Vines and grasses evoke gentle resilience, finding a way around obstacles and flourishing wherever there is room to grow.",
      zh: "花草藤蔓柔中有韧，善于绕开阻碍，只要有一点空间便能蓬勃生长。",
    },
  },
  丙: {
    image: { en: "The sun", zh: "太阳" },
    note: {
      en: "The sun shines on everything without choosing, an image of openness, generosity and warmth that is felt from afar.",
      zh: "太阳普照万物而不加挑选，象征坦荡、慷慨以及远远就能感受到的温暖。",
    },
  },
  丁: {
    image: { en: "A candle or lamp flame", zh: "灯烛之火" },
    note: {
      en: "A lamp flame is small yet steady, suggesting quiet attentiveness and the ability to bring light to a single room or a single heart.",
      zh: "灯烛之火虽小却稳定，象征细致入微的用心，能照亮一室，也能温暖一人。",
    },
  },
  戊: {
    image: { en: "A mountain or city wall of great earth", zh: "城墙高山" },
    note: {
      en: "The mountain stands broad and unmoved, an image of steadiness, protection and a calm sense of presence.",
      zh: "高山厚重不移，象征沉稳可靠、能护佑一方的从容气度。",
    },
  },
  己: {
    image: { en: "Field and garden soil", zh: "田园之土" },
    note: {
      en: "Garden soil receives seeds and nurtures them patiently, suggesting care, receptiveness and a talent for helping things grow.",
      zh: "田园之土接纳种子、耐心滋养，象征包容体贴、善于成全他人的一面。",
    },
  },
  庚: {
    image: { en: "An axe, ore or raw metal", zh: "刀斧顽铁" },
    note: {
      en: "Raw metal is strong and unpolished, an image of directness and resolve that becomes more refined as it is worked and tempered.",
      zh: "顽铁刚健而未经雕琢，象征直率与决断，经过锤炼之后方显锋芒与精纯。",
    },
  },
  辛: {
    image: { en: "Jewellery and fine metal", zh: "珠玉首饰" },
    note: {
      en: "Fine jewellery suggests delicacy and discernment, a quiet brilliance that shows best when it is cared for and given its proper setting.",
      zh: "珠玉温润精巧，象征细腻与讲究，在被珍视、被妥帖安放时最能显出光彩。",
    },
  },
  壬: {
    image: { en: "A great river or the sea", zh: "江河大海" },
    note: {
      en: "The great river moves with breadth and momentum, an image of an expansive mind that gathers many streams into one current.",
      zh: "江河奔流、气象开阔，象征胸怀宽广，能把百川汇成一股向前的力量。",
    },
  },
  癸: {
    image: { en: "Rain and dew", zh: "雨露" },
    note: {
      en: "Rain and dew arrive softly and nourish without fuss, suggesting sensitivity, intuition and a gentle, far-reaching influence.",
      zh: "雨露无声而润泽万物，象征敏感细腻、富有直觉，以及温和而深远的影响。",
    },
  },
};

export const BRANCH_NOTES: Readonly<Record<string, BranchNote>> = {
  子: {
    season: { en: "Mid-winter", zh: "仲冬" },
    hours: "23:00–01:00",
    note: {
      en: "Zi marks the deepest point of night and of winter, where the first faint stirring of yang begins to return.",
      zh: "子时是夜最深、冬最寒之处，一阳初生，微弱的生机正悄然回转。",
    },
  },
  丑: {
    season: { en: "Late winter", zh: "季冬" },
    hours: "01:00–03:00",
    note: {
      en: "Chou is cold, damp earth that quietly stores warmth and seeds through the last of the winter.",
      zh: "丑为寒湿之土，在冬末默默收藏着温度与种子。",
    },
  },
  寅: {
    season: { en: "Early spring", zh: "孟春" },
    hours: "03:00–05:00",
    note: {
      en: "Yin opens the spring, an image of the first light before dawn and life beginning to push upward.",
      zh: "寅开启春天，如黎明前的第一缕微光，万物开始萌动向上。",
    },
  },
  卯: {
    season: { en: "Mid-spring", zh: "仲春" },
    hours: "05:00–07:00",
    note: {
      en: "Mao is the full bloom of spring at sunrise, when growth spreads gently in every direction.",
      zh: "卯是日出时分、春意正浓之际，生机温和地向四面舒展。",
    },
  },
  辰: {
    season: { en: "Late spring", zh: "季春" },
    hours: "07:00–09:00",
    note: {
      en: "Chen is moist earth at the turn from spring to summer, traditionally seen as a reservoir that holds water and nurtures new growth.",
      zh: "辰为春夏之交的湿土，传统上被视为蓄水之库，滋养着新生之物。",
    },
  },
  巳: {
    season: { en: "Early summer", zh: "孟夏" },
    hours: "09:00–11:00",
    note: {
      en: "Si brings the rising warmth of early summer and the bright late morning, an image of energy gathering strength.",
      zh: "巳是初夏渐暖、上午明亮的时刻，象征力量正在积聚上升。",
    },
  },
  午: {
    season: { en: "Mid-summer", zh: "仲夏" },
    hours: "11:00–13:00",
    note: {
      en: "Wu is high noon and the height of summer, the peak of yang from which the first trace of yin begins to appear.",
      zh: "午为正午、盛夏，阳气到达顶点，一缕阴气也由此萌生。",
    },
  },
  未: {
    season: { en: "Late summer", zh: "季夏" },
    hours: "13:00–15:00",
    note: {
      en: "Wei is warm, dry earth in the long afternoon, when summer's growth ripens and begins to settle.",
      zh: "未为午后的燥土，盛夏的生长在此渐趋成熟、慢慢沉淀。",
    },
  },
  申: {
    season: { en: "Early autumn", zh: "孟秋" },
    hours: "15:00–17:00",
    note: {
      en: "Shen opens the autumn, an image of cooling air and the first gathering in of the harvest.",
      zh: "申开启秋天，天气转凉，人们开始收拢一年的收获。",
    },
  },
  酉: {
    season: { en: "Mid-autumn", zh: "仲秋" },
    hours: "17:00–19:00",
    note: {
      en: "You is the clear evening of mid-autumn, associated with ripeness, refinement and the setting sun.",
      zh: "酉是仲秋的清朗黄昏，与成熟、精炼和落日余晖相连。",
    },
  },
  戌: {
    season: { en: "Late autumn", zh: "季秋" },
    hours: "19:00–21:00",
    note: {
      en: "Xu is dry earth at dusk and the close of autumn, traditionally seen as a storehouse where the day's warmth is kept.",
      zh: "戌为暮色中的燥土、秋之尾声，传统上被视为收藏余温的库藏。",
    },
  },
  亥: {
    season: { en: "Early winter", zh: "孟冬" },
    hours: "21:00–23:00",
    note: {
      en: "Hai begins the winter and the quiet of night, an image of rest and of seeds of wood waiting within the water.",
      zh: "亥开启冬季与夜的宁静，象征休养生息，也蕴藏着水中待发的木之种子。",
    },
  },
};

export const TEN_GOD_NOTES: Readonly<Record<TenGod, TenGodNote>> = {
  比肩: {
    name: { en: "Companion / Friend", zh: "比肩" },
    relation: {
      en: "Same element, same polarity as the Day Master",
      zh: "与日主五行相同、阴阳相同",
    },
    note: {
      en: "Traditionally a theme of peers, self-reliance and standing shoulder to shoulder, inviting reflection on independence and cooperation.",
      zh: "传统上关联同辈、自立与并肩同行，可借此思考独立与合作之间的平衡。",
    },
  },
  劫财: {
    name: { en: "Rob Wealth / Rival", zh: "劫财" },
    relation: {
      en: "Same element as the Day Master, opposite polarity",
      zh: "与日主五行相同、阴阳相异",
    },
    note: {
      en: "Traditionally a theme of competition, boldness and shared resources, which can be read as both healthy drive and a reminder to share fairly.",
      zh: "传统上关联竞争、魄力与共享资源，既可视为积极的进取心，也提醒人公平地分享。",
    },
  },
  食神: {
    name: { en: "Eating God / Output", zh: "食神" },
    relation: {
      en: "Element the Day Master generates, same polarity",
      zh: "日主所生之五行，阴阳相同",
    },
    note: {
      en: "Traditionally a theme of ease, enjoyment and gentle self-expression, such as creative work done for its own pleasure.",
      zh: "传统上关联从容、享受与温和的自我表达，例如出于喜爱而做的创作。",
    },
  },
  伤官: {
    name: { en: "Hurting Officer / Expression", zh: "伤官" },
    relation: {
      en: "Element the Day Master generates, opposite polarity",
      zh: "日主所生之五行，阴阳相异",
    },
    note: {
      en: "Traditionally a theme of sharp talent, originality and questioning convention, inviting thought about how to voice ideas with care.",
      zh: "传统上关联才华外露、不拘一格与质疑成规，可借此思考如何更有分寸地表达想法。",
    },
  },
  偏财: {
    name: { en: "Indirect Wealth", zh: "偏财" },
    relation: {
      en: "Element the Day Master controls, same polarity",
      zh: "日主所克之五行，阴阳相同",
    },
    note: {
      en: "Traditionally a theme of opportunity, generosity and a wide social circle, a lens for reflecting on openness to the unexpected.",
      zh: "传统上关联机遇、慷慨与广阔的人际往来，可借此反思自己对意外之事的开放程度。",
    },
  },
  正财: {
    name: { en: "Direct Wealth", zh: "正财" },
    relation: {
      en: "Element the Day Master controls, opposite polarity",
      zh: "日主所克之五行，阴阳相异",
    },
    note: {
      en: "Traditionally a theme of diligence, steady effort and careful stewardship of what one has.",
      zh: "传统上关联勤勉、踏实的付出，以及对已有事物的用心经营。",
    },
  },
  七杀: {
    name: { en: "Seven Killings / Pressure", zh: "七杀" },
    relation: {
      en: "Element that controls the Day Master, same polarity",
      zh: "克日主之五行，阴阳相同",
    },
    note: {
      en: "Traditionally a theme of challenge, courage and decisive action under pressure, which many readings see as a source of resilience.",
      zh: "传统上关联挑战、胆识与压力下的果断，许多解读也把它看作磨炼韧性的来源。",
    },
  },
  正官: {
    name: { en: "Direct Officer / Authority", zh: "正官" },
    relation: {
      en: "Element that controls the Day Master, opposite polarity",
      zh: "克日主之五行，阴阳相异",
    },
    note: {
      en: "Traditionally a theme of order, responsibility and respect for agreed rules, inviting reflection on the structures one chooses to honour.",
      zh: "传统上关联秩序、责任与对规则的尊重，可借此思考自己愿意遵循怎样的规范。",
    },
  },
  偏印: {
    name: { en: "Indirect Resource", zh: "偏印" },
    relation: {
      en: "Element that generates the Day Master, same polarity",
      zh: "生日主之五行，阴阳相同",
    },
    note: {
      en: "Traditionally a theme of unconventional learning, intuition and independent thought, such as interests pursued off the beaten path.",
      zh: "传统上关联非常规的学习、直觉与独立思考，比如在冷门领域里的钻研。",
    },
  },
  正印: {
    name: { en: "Direct Resource", zh: "正印" },
    relation: {
      en: "Element that generates the Day Master, opposite polarity",
      zh: "生日主之五行，阴阳相异",
    },
    note: {
      en: "Traditionally a theme of support, learning and care received from others, and of passing that care on.",
      zh: "传统上关联扶持、学识以及从他人那里得到的关怀，也包括把这份关怀传递下去。",
    },
  },
};

export const PILLAR_NOTES: Readonly<Record<PillarKey, PillarNote>> = {
  year: {
    name: { en: "Year Pillar", zh: "年柱" },
    note: {
      en: "The year pillar is traditionally associated with ancestry, early life and the wider environment one is born into.",
      zh: "年柱在传统上与祖上渊源、幼年时光以及出生时所处的大环境相关联。",
    },
  },
  month: {
    name: { en: "Month Pillar", zh: "月柱" },
    note: {
      en: "The month pillar is traditionally associated with upbringing, family background and the season of birth, which colours the whole chart.",
      zh: "月柱在传统上与成长经历、家庭背景以及出生的季节相关联，季节之气也为整张命盘定下底色。",
    },
  },
  day: {
    name: { en: "Day Pillar", zh: "日柱" },
    note: {
      en: "The day pillar is traditionally associated with the self and close partnerships; its stem is the Day Master (日主), the reference point for the whole chart.",
      zh: "日柱在传统上与自我及亲密关系相关联；日柱天干即“日主”，是解读整张命盘的参照点。",
    },
  },
  hour: {
    name: { en: "Hour Pillar", zh: "时柱" },
    note: {
      en: "The hour pillar is traditionally associated with aspirations, creativity and later life.",
      zh: "时柱在传统上与志向、创造力以及晚年生活相关联。",
    },
  },
};

export const DAY_MASTER_INTRO: LocalizedText = {
  en: "The Day Master (日主) is the Heavenly Stem of the day pillar, and in Bazi tradition it stands for the self. Every other character in the chart is read in relation to it, which is how the Ten Gods are named.",
  zh: "日主是日柱的天干，在八字传统中代表“自己”。命盘中的其他字都以它为参照来解读，十神的名称也由此而来。",
};

export const HIDDEN_STEMS_NOTE: LocalizedText = {
  en: "Each Earthly Branch is traditionally said to contain one to three hidden stems (藏干), the elements held within it. They are ranked as main qi (本气), the branch's dominant element, followed by middle qi (中气) and residual qi (余气), which are present in smaller measure.",
  zh: "传统上认为每个地支内藏一到三个天干，称为“藏干”，代表蕴含其中的五行之气。其中最主要的是本气，其次为中气与余气，分量依次减弱。",
};

export const ELEMENT_COUNT_NOTE: LocalizedText = {
  en: "These counts are a simple tally of the visible stems and each branch's principal element; they are not a strength (旺衰) assessment or a “useful god” (用神) analysis. A count of zero does not mean an element is “missing” in any harmful sense, since traditional readings also weigh hidden stems, season and the interplay of the whole chart.",
  zh: "这里的数字只是对可见天干与各地支主气五行的简单统计，并不是旺衰判断，也不是用神分析。某个五行计数为零，并不意味着“缺”了什么而带来不好的影响，传统解读还会综合考虑藏干、季节以及整张命盘的相互作用。",
};
