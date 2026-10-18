import type { LocalizedText } from "@/lib/i18n/types";
import type { TarotCard } from "./types";

/**
 * The 22 Major Arcana, Rider–Waite–Smith numbering (Strength = 8, Justice = 11).
 *
 * All meanings are original, curated text written as symbolic reflection —
 * themes and invitations, never predictions or guaranteed outcomes.
 */

function t(en: string, zh: string): LocalizedText {
  return { en, zh };
}

interface CardSource {
  number: number;
  slug: string;
  name: LocalizedText;
  keywords: TarotCard["keywords"];
  upright: LocalizedText;
  reversed: LocalizedText;
  focus: TarotCard["focus"];
}

function defineCard(source: CardSource): TarotCard {
  const id = `major-${String(source.number).padStart(2, "0")}-${source.slug}`;
  return {
    id,
    arcana: "major",
    number: source.number,
    name: source.name,
    asset: `/cards/${id}.svg`,
    keywords: source.keywords,
    upright: source.upright,
    reversed: source.reversed,
    focus: source.focus,
  };
}

const SOURCES: readonly CardSource[] = [
  {
    number: 0,
    slug: "fool",
    name: t("The Fool", "愚者"),
    keywords: {
      upright: [t("Beginnings", "新的开端"), t("Openness", "敞开"), t("Trust", "信任")],
      reversed: [t("Hesitation", "犹豫"), t("Carelessness", "轻率"), t("Holding back", "裹足不前")],
    },
    upright: t(
      "A fresh path opens before you, and the card invites you to step onto it with curiosity rather than a full map. It speaks of beginnings that ask for trust more than certainty.",
      "一条新路在眼前展开，这张牌邀请你带着好奇而非完整的地图踏上旅程。它讲述的开端，需要的更多是信任，而不是确定。",
    ),
    reversed: t(
      "The urge to leap may be tangled with either too much fear or too little care. It may help to ask which of the two is speaking louder right now.",
      "想要纵身一跃的冲动，或许正与过多的恐惧或过少的谨慎纠缠在一起。不妨问问自己：此刻哪一种声音更响亮？",
    ),
    focus: {
      love: t(
        "What might shift if you met connection with the openness of a first encounter?",
        "如果以初次相遇般的坦然去面对一段关系，会有什么不同？",
      ),
      career: t(
        "Is there a new direction you keep circling because it cannot yet be fully planned?",
        "是否有一个新方向，你一直在它周围打转，只因为它还无法被完全规划？",
      ),
      self: t(
        "Notice where you could let yourself be a beginner again, without needing to be good at it yet.",
        "留意一下，在哪些地方你可以允许自己重新做个初学者，不必急着做好。",
      ),
    },
  },
  {
    number: 1,
    slug: "magician",
    name: t("The Magician", "魔术师"),
    keywords: {
      upright: [t("Focus", "专注"), t("Resourcefulness", "善用资源"), t("Intention", "意图")],
      reversed: [t("Scattered energy", "分散"), t("Self-doubt", "自我怀疑"), t("Untapped skill", "未尽之才")],
    },
    upright: t(
      "The tools you need may already be within reach; the card points to the quiet power of gathering them with clear intention. It is a reminder that focus can turn ideas into form.",
      "你所需的工具或许早已在手边，这张牌指向以清晰的意图将它们汇聚起来的那份安静力量。它提醒你：专注能让想法化为现实。",
    ),
    reversed: t(
      "Energy may be spread across too many directions, or talent may be waiting behind hesitation. This can be a moment to choose one thread and follow it honestly.",
      "精力也许分散在太多方向，或者才能正藏在犹豫背后。此刻或许适合选定一根线，真诚地循着它走下去。",
    ),
    focus: {
      love: t(
        "How clearly are you expressing what you want to create together?",
        "你是否清楚地表达了，自己希望和对方一起创造怎样的关系？",
      ),
      career: t(
        "Which skills you already have are being underused in your current work?",
        "你已有的哪些能力，在目前的工作中还没有被充分发挥？",
      ),
      self: t(
        "Consider what becomes possible when your attention, words, and actions point the same way.",
        "想一想，当你的注意力、言语和行动指向同一处时，会有哪些可能浮现。",
      ),
    },
  },
  {
    number: 2,
    slug: "high-priestess",
    name: t("The High Priestess", "女祭司"),
    keywords: {
      upright: [t("Intuition", "直觉"), t("Stillness", "静默"), t("Inner knowing", "内在觉知")],
      reversed: [t("Ignored instincts", "忽视直觉"), t("Noise", "喧嚣"), t("Withheld truth", "隐而不言")],
    },
    upright: t(
      "Beneath the surface of things, a quieter knowing waits to be heard. The card invites stillness and patience, trusting that some answers arrive only when we stop chasing them.",
      "在事物表面之下，有一种更安静的觉知等待被聆听。这张牌邀请你沉静与耐心，相信有些答案只在停止追逐时才会到来。",
    ),
    reversed: t(
      "Outer noise may be drowning out your inner voice, or something felt may be going unspoken. Gentle quiet could help you hear what you already sense.",
      "外界的喧嚣也许盖过了内心的声音，或者有些感受一直未被说出。给自己一点安静，或许能听见你早已隐约感知的东西。",
    ),
    focus: {
      love: t(
        "What do you sense in this connection that you have not yet put into words?",
        "在这段关系中，有什么是你已经感觉到、却还没有说出口的？",
      ),
      career: t(
        "Before deciding, what does your quieter judgment say beneath the pressure to act?",
        "在做决定之前，撇开急于行动的压力，你内心更沉静的判断是什么？",
      ),
      self: t(
        "Give yourself a moment of silence and notice which thought returns on its own.",
        "给自己片刻静默，留意哪个念头会自己悄悄回来。",
      ),
    },
  },
  {
    number: 3,
    slug: "empress",
    name: t("The Empress", "皇后"),
    keywords: {
      upright: [t("Nurturing", "滋养"), t("Abundance", "丰盛"), t("Creativity", "创造")],
      reversed: [t("Depletion", "耗竭"), t("Overgiving", "过度付出"), t("Creative block", "创意受阻")],
    },
    upright: t(
      "This card carries the feeling of a garden in full bloom: care, growth, and the pleasure of the senses. It invites you to tend what you love and let it flourish in its own time.",
      "这张牌带着花园盛放般的气息：关怀、生长，以及感官的愉悦。它邀请你照料所爱之物，让它按自己的节奏繁茂起来。",
    ),
    reversed: t(
      "You may be pouring care outward while your own well runs low. It could be a gentle signal to receive, rest, and replenish.",
      "你也许一直在向外倾注关怀，而自己的泉源却渐渐干涸。这或许是一个温柔的提醒：学会接受、休息与补给。",
    ),
    focus: {
      love: t(
        "How does care flow in this connection, and does it move in both directions?",
        "在这段关系里，关怀是如何流动的？它是否双向往来？",
      ),
      career: t(
        "Which project would grow best with patience and steady tending rather than pressure?",
        "哪件事更需要耐心与持续的照料，而不是催逼，才能长得好？",
      ),
      self: t(
        "What would it look like to nourish yourself as warmly as you nourish others?",
        "如果你像照顾他人那样温暖地照顾自己，那会是什么样子？",
      ),
    },
  },
  {
    number: 4,
    slug: "emperor",
    name: t("The Emperor", "皇帝"),
    keywords: {
      upright: [t("Structure", "秩序"), t("Stability", "稳定"), t("Responsibility", "担当")],
      reversed: [t("Rigidity", "僵化"), t("Control", "控制"), t("Shaky foundations", "根基不稳")],
    },
    upright: t(
      "The Emperor speaks of structure that protects rather than confines: clear boundaries, steady decisions, and taking ownership. It invites you to build a frame strong enough to hold what matters.",
      "皇帝讲述的是守护而非束缚的秩序：清晰的边界、稳健的决断，以及勇于担当。它邀请你搭起一个足够坚固的框架，来承载真正重要的东西。",
    ),
    reversed: t(
      "Structure may have hardened into rigidity, or the ground beneath you may feel less firm than you would like. Consider where firmness helps and where it only tightens.",
      "秩序也许已僵化为刻板，或者脚下的根基并不如你期望的那般稳固。想一想，哪里需要坚定，哪里只是在一味收紧。",
    ),
    focus: {
      love: t(
        "Which boundaries would help this connection feel safer for everyone involved?",
        "怎样的边界能让这段关系里的每个人都更安心？",
      ),
      career: t(
        "Where could a clearer plan or structure ease the pressure you feel at work?",
        "在工作中，哪里若有更清晰的规划或结构，就能缓解你感受到的压力？",
      ),
      self: t(
        "Notice whether your routines are supporting you or simply keeping you in place.",
        "留意你的日常规律，是在支撑你，还是只是把你困在原地。",
      ),
    },
  },
  {
    number: 5,
    slug: "hierophant",
    name: t("The Hierophant", "教皇"),
    keywords: {
      upright: [t("Tradition", "传统"), t("Guidance", "指引"), t("Shared values", "共同信念")],
      reversed: [t("Questioning", "质疑"), t("Nonconformity", "不循常规"), t("Own path", "自寻其道")],
    },
    upright: t(
      "This card points toward inherited wisdom, mentors, and the traditions that give life shape and meaning. It invites you to consider what you have learned from others and which teachings still feel true.",
      "这张牌指向传承的智慧、引路的师长，以及为生活赋予形状与意义的传统。它邀请你回顾从他人那里学到的东西，看看哪些教诲至今仍觉真切。",
    ),
    reversed: t(
      "Familiar rules may no longer fit as comfortably as they once did. This can be an invitation to examine them with respect and decide which ones you still choose.",
      "熟悉的规矩也许已不像从前那样合身。这或许是一个契机，带着尊重去审视它们，再决定哪些仍值得你继续选择。",
    ),
    focus: {
      love: t("Which shared values quietly hold this connection together?", "是哪些共同的信念，在默默维系着这段关系？"),
      career: t(
        "Is there someone whose experience you could learn from, or who could learn from yours?",
        "有没有谁的经验值得你借鉴，或者有谁可以从你的经验中受益？",
      ),
      self: t(
        "Which beliefs did you inherit, and which have you truly made your own?",
        "哪些信念是你承袭而来的，哪些已真正成为你自己的？",
      ),
    },
  },
  {
    number: 6,
    slug: "lovers",
    name: t("The Lovers", "恋人"),
    keywords: {
      upright: [t("Connection", "联结"), t("Alignment", "契合"), t("Heartfelt choice", "真心抉择")],
      reversed: [t("Disharmony", "失和"), t("Inner conflict", "内心冲突"), t("Misalignment", "错位")],
    },
    upright: t(
      "The Lovers speaks of meaningful connection and of choices made in harmony with your values. It invites you to notice where heart and principle meet, in relationships and beyond.",
      "恋人牌讲述深刻的联结，以及与自身价值相契合的抉择。它邀请你留意，在关系之中乃至更广阔的生活里，心意与原则在何处交汇。",
    ),
    reversed: t(
      "Something may feel out of step, whether between people or between what you want and what you value. Honest reflection could help bring the pieces back into conversation.",
      "或许有什么正在失去默契，无论是人与人之间，还是你的渴望与你的信念之间。坦诚的省思，也许能让这些碎片重新开始对话。",
    ),
    focus: {
      love: t(
        "What does feeling truly met and chosen look like for you?",
        "对你而言，被真正理解、被真心选择，是什么样子？",
      ),
      career: t(
        "Does the path in front of you align with what you genuinely care about?",
        "眼前这条路，是否与你真正在意的东西相契合？",
      ),
      self: t(
        "Where might a decision become clearer if you let your values speak first?",
        "如果先让自己的价值观发声，哪个决定可能会变得清晰起来？",
      ),
    },
  },
  {
    number: 7,
    slug: "chariot",
    name: t("The Chariot", "战车"),
    keywords: {
      upright: [t("Determination", "决心"), t("Momentum", "前进"), t("Self-direction", "自我驾驭")],
      reversed: [t("Lost direction", "迷失方向"), t("Inner tug-of-war", "内在拉扯"), t("Forcing", "强求")],
    },
    upright: t(
      "The Chariot carries the energy of focused movement, holding opposing pulls together and steering them in one direction. It invites you to move forward with resolve while keeping a steady hand.",
      "战车承载着专注前行的力量：将彼此拉扯的力量握在一起，引向同一个方向。它邀请你坚定地向前，同时稳稳握住缰绳。",
    ),
    reversed: t(
      "Different parts of you may be pulling in different directions, or effort may be turning into force. Pausing to realign could serve you better than pushing harder.",
      "你内心的不同部分也许正朝不同方向拉扯，或者努力正在变成强求。停下来重新校准方向，或许比更用力地推进更有益。",
    ),
    focus: {
      love: t(
        "Are you both moving in a direction you have actually talked about together?",
        "你们前进的方向，是否是彼此真正一起商量过的？",
      ),
      career: t(
        "What single goal would bring your scattered efforts into one clear line?",
        "哪一个目标，能把你分散的努力汇成一条清晰的线？",
      ),
      self: t(
        "Notice which inner forces you are trying to steer, and whether they agree on where to go.",
        "留意你正在驾驭的内在力量，它们对要去的方向是否达成了一致。",
      ),
    },
  },
  {
    number: 8,
    slug: "strength",
    name: t("Strength", "力量"),
    keywords: {
      upright: [t("Gentle courage", "温柔的勇气"), t("Patience", "耐心"), t("Compassion", "慈悲")],
      reversed: [t("Self-doubt", "自我怀疑"), t("Inner unrest", "内心不安"), t("Harshness", "苛刻")],
    },
    upright: t(
      "Strength here is soft rather than loud: the courage to meet wild feelings with patience and warmth. It invites a steadiness that comes from compassion, not from force.",
      "这里的力量是柔软的，而非张扬的：以耐心与温暖去面对内心汹涌的情绪。它邀请一种源自慈悲而非强硬的沉稳。",
    ),
    reversed: t(
      "You may be doubting your own resilience, or treating yourself with more harshness than help. Kindness toward your struggles could be where strength returns.",
      "你也许正怀疑自己的韧性，或者对自己苛责多于扶持。善待自己的挣扎，或许正是力量回归的地方。",
    ),
    focus: {
      love: t(
        "How might patience and gentleness change a tension you are carrying?",
        "耐心与温柔，或许能如何化解你心中的那份紧张？",
      ),
      career: t(
        "Where could quiet persistence achieve more than a show of force?",
        "在哪些地方，安静的坚持会比用力的姿态走得更远？",
      ),
      self: t(
        "What feeling in you is asking to be met with warmth instead of control?",
        "你内心有哪种情绪，正渴望被温暖接住，而不是被压制？",
      ),
    },
  },
  {
    number: 9,
    slug: "hermit",
    name: t("The Hermit", "隐士"),
    keywords: {
      upright: [t("Reflection", "内省"), t("Solitude", "独处"), t("Inner light", "内心之光")],
      reversed: [t("Isolation", "孤立"), t("Withdrawal", "退缩"), t("Avoiding insight", "回避省思")],
    },
    upright: t(
      "The Hermit holds a small lantern on a quiet path, suggesting a time to step back and look inward. Solitude here is not loneliness but a space where your own light becomes visible.",
      "隐士在寂静的小径上提着一盏小灯，暗示此时适合退后一步，向内观照。这里的独处并非孤单，而是一方让你看见自身光亮的空间。",
    ),
    reversed: t(
      "Retreat may have drifted into isolation, or reflection may be avoided because it feels uncomfortable. A gentle balance between solitude and connection could help.",
      "退隐也许已渐渐变成孤立，或者因为不自在而回避了内省。在独处与联结之间找到温和的平衡，或许会有所帮助。",
    ),
    focus: {
      love: t(
        "What do you need to understand about yourself before you can share it with someone else?",
        "在与他人分享之前，有什么是你需要先了解自己的？",
      ),
      career: t(
        "Would some unhurried time alone help you see your next step more clearly?",
        "一段不慌不忙的独处时光，是否能让你更清楚地看见下一步？",
      ),
      self: t(
        "Notice what your inner voice says when the noise of the day finally settles.",
        "留意一天的喧嚣终于平息时，你内心的声音在说些什么。",
      ),
    },
  },
  {
    number: 10,
    slug: "wheel-of-fortune",
    name: t("Wheel of Fortune", "命运之轮"),
    keywords: {
      upright: [t("Cycles", "循环"), t("Change", "变化"), t("Turning point", "转折")],
      reversed: [t("Resistance", "抗拒"), t("Repeating patterns", "旧模式重现"), t("Feeling stuck", "停滞")],
    },
    upright: t(
      "The Wheel reminds us that life moves in seasons, and that change is a natural part of every story. It invites you to notice the turning and to meet it with flexibility rather than fear.",
      "命运之轮提醒我们，生活如四季般流转，变化本是每个故事的一部分。它邀请你察觉这份转动，以灵活而非恐惧去迎接它。",
    ),
    reversed: t(
      "A familiar pattern may be coming round again, or resistance may be making change feel harder than it is. Recognizing the cycle can be the first step toward stepping out of it.",
      "某个熟悉的模式也许又一次绕了回来，或者抗拒让变化显得比实际更艰难。认出这个循环，可能就是走出它的第一步。",
    ),
    focus: {
      love: t(
        "Which season do you sense this connection is moving through right now?",
        "你觉得这段关系此刻正经历着怎样的季节？",
      ),
      career: t(
        "What changing circumstance could you work with rather than against?",
        "面对哪些变化中的情境，你可以选择顺势而为，而不是逆流对抗？",
      ),
      self: t(
        "Is there a pattern in your life that keeps returning, and what might it be asking of you?",
        "你的生活中是否有某个反复出现的模式？它或许在向你提出什么？",
      ),
    },
  },
  {
    number: 11,
    slug: "justice",
    name: t("Justice", "正义"),
    keywords: {
      upright: [t("Fairness", "公正"), t("Clarity", "明晰"), t("Accountability", "担责")],
      reversed: [t("Imbalance", "失衡"), t("Avoidance", "逃避"), t("Unclear truth", "真相不明")],
    },
    upright: t(
      "Justice invites clear seeing and honest weighing: what is fair, what is true, and what is yours to own. It speaks of decisions made with both head and conscience.",
      "正义邀请你清明地看、诚实地衡量：什么是公平的，什么是真实的，什么是你该承担的。它讲述的是理智与良知并重的抉择。",
    ),
    reversed: t(
      "Something may feel out of balance, or a hard truth may be easier to look away from. Gently returning to honesty, with yourself first, could restore a sense of steadiness.",
      "也许有什么正处于失衡，或者某个难以面对的事实更容易被回避。温和地回到诚实之中，先对自己坦诚，或许能找回内心的安定。",
    ),
    focus: {
      love: t(
        "Does the give and take in this connection feel fair to you?",
        "在这段关系中，付出与收获的分寸，你觉得公平吗？",
      ),
      career: t(
        "Which decision would you feel at peace with when you look back on it later?",
        "哪个决定，是你日后回头看时仍能心安的？",
      ),
      self: t(
        "Where might you take honest ownership without slipping into self-blame?",
        "在哪些地方，你可以坦然承担责任，而不陷入自责？",
      ),
    },
  },
  {
    number: 12,
    slug: "hanged-man",
    name: t("The Hanged Man", "倒吊人"),
    keywords: {
      upright: [t("Pause", "暂停"), t("New perspective", "换个视角"), t("Surrender", "放下")],
      reversed: [t("Stalling", "拖延"), t("Resistance", "抗拒"), t("Needless sacrifice", "徒劳的牺牲")],
    },
    upright: t(
      "The Hanged Man suggests a willing pause, seeing the world from an unexpected angle. What looks like waiting may be a quiet shift in understanding.",
      "倒吊人暗示一场心甘情愿的停顿，从意想不到的角度看待世界。看似停滞的等待，也许正是理解悄然转变的时刻。",
    ),
    reversed: t(
      "A pause may be stretching on without purpose, or you may be giving something up that does not need to be given. It may be worth asking what this waiting is really for.",
      "停顿也许正在漫无目的地延长，或者你正在放弃一些本不必放弃的东西。不妨问问：这份等待究竟是为了什么？",
    ),
    focus: {
      love: t(
        "How might this connection look if you saw it from the other side?",
        "如果站在另一边看这段关系，它会呈现出怎样的样貌？",
      ),
      career: t(
        "Is there a situation at work that might ease if you stopped pushing and looked at it differently?",
        "工作中是否有某个局面，只要你停止用力、换个角度去看，就可能有所松动？",
      ),
      self: t(
        "What might you learn by letting go of the need to resolve everything right now?",
        "如果放下“必须立刻解决一切”的执念，你可能会领悟到什么？",
      ),
    },
  },
  {
    number: 13,
    slug: "death",
    name: t("Death", "死神"),
    keywords: {
      upright: [t("Transformation", "蜕变"), t("Endings", "终结"), t("Renewal", "新生")],
      reversed: [t("Clinging", "执着"), t("Resisting change", "抗拒改变"), t("Lingering", "迟迟不走")],
    },
    upright: t(
      "Despite its name, this card is not about literal death; it symbolizes the close of a chapter and the transformation that follows. Something may be ready to end so that something new has room to grow.",
      "尽管名字如此，这张牌并非指字面意义上的死亡，而是象征一个篇章的落幕，以及随之而来的蜕变。也许有些东西已准备好结束，好为新的事物腾出生长的空间。",
    ),
    reversed: t(
      "A chapter may be asking to close while part of you holds on to it. Acknowledging what has already ended can make the transition feel gentler.",
      "某个篇章或许正等待落幕，而你心里仍有一部分紧紧抓着不放。承认那些已经结束的事，或许能让这段过渡变得温和一些。",
    ),
    focus: {
      love: t(
        "Which old pattern in how you relate might be ready to be laid to rest?",
        "在你与人相处的方式里，有哪种旧模式也许已到了该放下的时候？",
      ),
      career: t(
        "What role, habit, or plan might you be outgrowing?",
        "有哪种角色、习惯或计划，也许已经不再适合如今的你？",
      ),
      self: t(
        "Notice what you are ready to release, and what might grow in the space it leaves.",
        "留意那些你已准备放下的东西，以及它们留下的空间里可能生长出什么。",
      ),
    },
  },
  {
    number: 14,
    slug: "temperance",
    name: t("Temperance", "节制"),
    keywords: {
      upright: [t("Balance", "平衡"), t("Moderation", "适度"), t("Harmony", "调和")],
      reversed: [t("Excess", "过度"), t("Impatience", "急躁"), t("Imbalance", "失调")],
    },
    upright: t(
      "Temperance pours gently from one cup to another, blending opposites into something whole. It invites patience, moderation, and the art of finding the middle way.",
      "节制将水从一只杯子缓缓倒入另一只，把相对的事物融合为一体。它邀请你以耐心与适度，练习寻找中道的艺术。",
    ),
    reversed: t(
      "Life may feel tipped toward too much of one thing, or impatience may be rushing a process that needs time. Small adjustments could restore a sense of flow.",
      "生活也许正向某一端过度倾斜，或者急躁正在催促一个需要时间的过程。一些细小的调整，或许就能让一切重新流动起来。",
    ),
    focus: {
      love: t(
        "How might you blend your needs with someone else's without losing either?",
        "怎样才能让你与对方的需要彼此交融，而不失去任何一方？",
      ),
      career: t(
        "Where could a steadier, more measured pace serve you better than intensity?",
        "在哪些地方，更稳健、有分寸的节奏会比全力冲刺更适合你？",
      ),
      self: t(
        "Notice which parts of your life feel overfilled, and which feel quietly empty.",
        "留意生活中哪些部分已经满溢，哪些部分却悄然空着。",
      ),
    },
  },
  {
    number: 15,
    slug: "devil",
    name: t("The Devil", "恶魔"),
    keywords: {
      upright: [t("Attachment", "执念"), t("Temptation", "诱惑"), t("Patterns", "惯性")],
      reversed: [t("Release", "释放"), t("Awareness", "觉察"), t("Reclaiming choice", "重拾选择")],
    },
    upright: t(
      "The Devil shines a light on the habits and attachments that quietly hold us in place. Its chains often hang loosely, inviting you to notice where you have more freedom than it seems.",
      "恶魔照亮了那些悄悄将我们困住的习惯与执念。它的锁链往往系得很松，邀请你发现：自己拥有的自由，或许比看上去更多。",
    ),
    reversed: t(
      "You may be loosening the grip of an old habit or seeing a pattern clearly for the first time. Awareness itself can be the beginning of choosing differently.",
      "你也许正在松开某个旧习惯的束缚，或第一次清楚地看见某种模式。觉察本身，便可能是做出不同选择的开始。",
    ),
    focus: {
      love: t(
        "Is there a pattern in how you connect that feels familiar but no longer feels good?",
        "在你与人建立联结的方式中，是否有某种模式虽然熟悉，却已不再让你感到舒服？",
      ),
      career: t(
        "Which obligations do you carry out of habit rather than genuine choice?",
        "哪些责任是你出于惯性在扛，而非真心选择？",
      ),
      self: t(
        "What would it feel like to hold a familiar craving with curiosity instead of judgment?",
        "如果以好奇而非评判去面对某种熟悉的渴求，会是什么感觉？",
      ),
    },
  },
  {
    number: 16,
    slug: "tower",
    name: t("The Tower", "高塔"),
    keywords: {
      upright: [t("Sudden change", "骤变"), t("Revelation", "顿悟"), t("Breaking open", "破旧")],
      reversed: [t("Averted upheaval", "避开动荡"), t("Fear of change", "惧怕改变"), t("Slow release", "缓慢瓦解")],
    },
    upright: t(
      "The Tower speaks of structures built on shaky ground and the moments of insight that shake them loose. Though unsettling, such moments can clear space for something more honest.",
      "高塔讲述建立在不稳根基上的结构，以及那些令它们动摇的顿悟时刻。这样的时刻虽然令人不安，却可能为更真实的事物腾出空间。",
    ),
    reversed: t(
      "Change may be happening gradually rather than all at once, or you may be holding up a structure out of fear of what lies beyond it. Gentle honesty can soften the shift.",
      "变化或许正在缓慢发生，而非一夜之间；又或者，你因为惧怕未知而勉力撑着某个结构。温和的坦诚，能让这场转变柔和一些。",
    ),
    focus: {
      love: t(
        "Is there an unspoken truth that, once acknowledged, could make room for something sturdier?",
        "是否有某个未曾说出的真相，一旦被承认，就能为更坚实的关系腾出空间？",
      ),
      career: t(
        "Which assumption about your path might be worth testing before it is tested for you?",
        "关于你所走的路，有哪个假设值得你先主动检验，而不是等着被现实检验？",
      ),
      self: t(
        "What belief about yourself might be ready to give way to something truer?",
        "你对自己的哪个看法，也许已准备好让位给更真实的认识？",
      ),
    },
  },
  {
    number: 17,
    slug: "star",
    name: t("The Star", "星星"),
    keywords: {
      upright: [t("Hope", "希望"), t("Healing", "疗愈"), t("Renewal", "复苏")],
      reversed: [t("Discouragement", "灰心"), t("Disconnection", "疏离"), t("Faded faith", "信念黯淡")],
    },
    upright: t(
      "After a storm, The Star offers calm water and a clear night sky. It speaks of hope, quiet healing, and the gentle return of trust in what lies ahead.",
      "风暴过后，星星带来平静的水面与澄澈的夜空。它讲述希望、静静的疗愈，以及对前路的信任温柔地回归。",
    ),
    reversed: t(
      "Hope may feel dimmer than usual, or you may feel distant from what once inspired you. Small acts of care can help rekindle that light little by little.",
      "希望也许比往常黯淡，或者你感到与曾经激励你的事物渐行渐远。一些细小的关照，能帮你一点一点重新点亮那束光。",
    ),
    focus: {
      love: t(
        "What gentle hope do you hold for how you want to love and be loved?",
        "关于爱与被爱，你心中怀着怎样温柔的期许？",
      ),
      career: t(
        "Which long-held aspiration still glimmers, even if it feels far away?",
        "有哪个长久以来的志向，即使看似遥远，仍在闪着微光？",
      ),
      self: t(
        "Notice what helps you feel renewed, even in small and quiet ways.",
        "留意那些能让你重新焕发生机的事物，哪怕它们微小而安静。",
      ),
    },
  },
  {
    number: 18,
    slug: "moon",
    name: t("The Moon", "月亮"),
    keywords: {
      upright: [t("Uncertainty", "迷茫"), t("Dreams", "梦境"), t("Subconscious", "潜意识")],
      reversed: [t("Clarity returning", "渐趋明朗"), t("Released fears", "释怀恐惧"), t("Truth surfacing", "真相浮现")],
    },
    upright: t(
      "Under moonlight, paths look softer and less certain, and imagination fills the gaps. The card invites you to honor your dreams and feelings while gently questioning what fear might be adding.",
      "月光之下，道路显得朦胧而不确定，想象填补着其间的空白。这张牌邀请你珍视自己的梦境与感受，同时温和地追问：恐惧是否为它们添了几分颜色？",
    ),
    reversed: t(
      "Confusion may be lifting, and what seemed shadowy may start to look more ordinary. This can be a time to let go of worries that no longer match what you see.",
      "迷雾或许正在散去，原本显得幽暗的事物也开始变得寻常。此时也许适合放下那些已与眼前所见不再相符的担忧。",
    ),
    focus: {
      love: t(
        "Which feelings in this connection come from what is happening, and which from what you fear?",
        "这段关系中的哪些感受源于当下的真实，哪些源于你的担忧？",
      ),
      career: t(
        "Where might you need more information before trusting the story your mind is telling?",
        "在相信脑海中编织的故事之前，你在哪些方面也许还需要更多信息？",
      ),
      self: t(
        "What images or feelings have been surfacing in your dreams or quiet moments lately?",
        "近来在梦里或独处的片刻，有哪些画面或感受悄然浮现？",
      ),
    },
  },
  {
    number: 19,
    slug: "sun",
    name: t("The Sun", "太阳"),
    keywords: {
      upright: [t("Joy", "喜悦"), t("Vitality", "活力"), t("Clarity", "明朗")],
      reversed: [t("Clouded joy", "喜悦蒙尘"), t("Low energy", "倦怠"), t("Dimmed light", "光芒暗淡")],
    },
    upright: t(
      "The Sun brings warmth, openness, and the simple pleasure of being seen as you are. It invites you to let joy in and share your light without dimming it.",
      "太阳带来温暖、坦荡，以及以本来面目被看见的单纯喜悦。它邀请你让快乐进来，毫不黯淡地分享你的光芒。",
    ),
    reversed: t(
      "Joy may be present but partly hidden behind clouds of fatigue or doubt. Reconnecting with simple, playful moments could help the warmth come through.",
      "喜悦也许仍在，只是被疲惫或怀疑的云层遮去了一部分。重新拥抱简单而带着玩心的时刻，或许能让温暖透出来。",
    ),
    focus: {
      love: t(
        "When do you feel most like yourself with the people you care about?",
        "和在乎的人在一起时，什么时刻让你最像你自己？",
      ),
      career: t(
        "Which part of your work brings you genuine enthusiasm, and how could it have more room?",
        "工作中哪一部分让你由衷投入？怎样才能给它更多空间？",
      ),
      self: t(
        "What small delight could you let yourself fully enjoy today?",
        "今天，有什么小小的快乐，是你可以让自己尽情享受的？",
      ),
    },
  },
  {
    number: 20,
    slug: "judgement",
    name: t("Judgement", "审判"),
    keywords: {
      upright: [t("Awakening", "觉醒"), t("Reflection", "回顾"), t("Calling", "召唤")],
      reversed: [t("Self-criticism", "自我苛责"), t("Doubt", "疑虑"), t("Ignored calling", "忽视召唤")],
    },
    upright: t(
      "Judgement sounds a call to look back with honesty and rise into a clearer sense of who you are becoming. It speaks of awakening, forgiveness, and answering what calls to you.",
      "审判吹响号角，邀请你诚实地回望过去，并迈向对“正在成为的自己”更清晰的认识。它讲述觉醒、宽恕，以及回应内心的召唤。",
    ),
    reversed: t(
      "Looking back may be turning into harsh self-judgment, or an inner call may be going unanswered. Meeting your past with understanding could make the next step lighter.",
      "回望或许正变成严苛的自我评判，或者内心的某个召唤一直无人回应。以理解之心面对过往，也许能让下一步走得更轻盈。",
    ),
    focus: {
      love: t(
        "What have past relationships taught you about what you truly need?",
        "过往的关系让你明白了，自己真正需要的是什么？",
      ),
      career: t(
        "Is there a calling you have heard for a while but not yet answered?",
        "是否有一个召唤，你早已听见，却还没有回应？",
      ),
      self: t("What would it mean to forgive an earlier version of yourself?", "原谅从前的自己，对你而言意味着什么？"),
    },
  },
  {
    number: 21,
    slug: "world",
    name: t("The World", "世界"),
    keywords: {
      upright: [t("Completion", "圆满"), t("Wholeness", "完整"), t("Integration", "融合")],
      reversed: [t("Loose ends", "未竟之事"), t("Delayed closure", "迟迟未了"), t("Seeking closure", "寻求了结")],
    },
    upright: t(
      "The World marks the completion of a cycle, a moment to honor how far you have come. It invites a sense of wholeness and readiness to carry what you have learned into what comes next.",
      "世界标志着一个循环的圆满，是时候向一路走来的自己致意。它邀请你感受内在的完整，并准备好带着所学迈向下一段旅程。",
    ),
    reversed: t(
      "A chapter may feel nearly finished but not quite closed. Gently tending to the remaining threads could bring the sense of completion you are looking for.",
      "某个篇章也许已接近尾声，却还未真正画上句号。温和地收拢那些剩余的线头，或许能带来你所寻找的圆满感。",
    ),
    focus: {
      love: t(
        "How has this connection, or its absence, helped you grow into who you are now?",
        "这段关系，或它的缺席，如何帮助你成长为如今的自己？",
      ),
      career: t(
        "What accomplishment deserves to be acknowledged before you move to the next goal?",
        "在奔向下一个目标之前，有哪项成就值得你好好肯定？",
      ),
      self: t(
        "Take a moment to notice the many experiences that have come together to make you whole.",
        "花一点时间，留意那些汇聚起来、让你成为完整自己的种种经历。",
      ),
    },
  },
];

export const MAJOR_ARCANA: readonly TarotCard[] = SOURCES.map(defineCard);

export const CARD_IDS: readonly string[] = MAJOR_ARCANA.map((card) => card.id);

const CARDS_BY_ID: ReadonlyMap<string, TarotCard> = new Map(MAJOR_ARCANA.map((card) => [card.id, card]));

export function getCard(id: string): TarotCard | undefined {
  return CARDS_BY_ID.get(id);
}
