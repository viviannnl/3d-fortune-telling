import type { LocalizedText } from "@/lib/i18n/types";

/** Small, warm encouragements revealed by the sanctuary's hidden charms. Never predictions. */
export const BLESSINGS: readonly LocalizedText[] = [
  { en: "You are allowed to bloom slowly.", zh: "你可以慢慢地绽放。" },
  { en: "Even the moon has phases. Rest is part of your light.", zh: "月亮也有阴晴圆缺，休息也是你光芒的一部分。" },
  { en: "Something kind is on its way to you.", zh: "有温柔的事情，正在朝你走来。" },
  { en: "You have already come further than you think.", zh: "你走过的路，比你以为的更远。" },
  { en: "Your quiet efforts are not invisible.", zh: "你安静的努力，并不是没有人看见。" },
  { en: "Be as gentle with yourself as you are with others.", zh: "像对待别人那样，温柔地对待自己。" },
  { en: "Today, one small step is enough.", zh: "今天，迈出一小步就足够了。" },
  { en: "The stars took a long time to shine, too.", zh: "星星也花了很久，才学会发光。" },
  { en: "You are a good place to come home to.", zh: "你本身，就是一个值得回去的地方。" },
  { en: "Uncertainty is also room for wonder.", zh: "不确定，也意味着还有惊喜的空间。" },
  { en: "Breathe. You don't have to have it all figured out.", zh: "深呼吸，你不必把一切都想清楚。" },
  { en: "Your heart knows more than it says out loud.", zh: "你的心，懂得比它说出口的更多。" },
  { en: "Softness is a kind of strength.", zh: "柔软，也是一种力量。" },
  { en: "Somewhere tonight, someone is glad you exist.", zh: "今晚的某个地方，有人因为你的存在而开心。" },
  { en: "Let yourself be surprised by how much you can grow.", zh: "允许自己被自己的成长惊喜到。" },
  { en: "The light you give away comes back in other forms.", zh: "你给出的光，会以别的样子回到你身边。" },
  { en: "It's okay to begin again — as many times as you need.", zh: "重新开始没关系，需要几次都可以。" },
  { en: "You are not behind. You are on your own path.", zh: "你没有落后，你只是在走自己的路。" },
  { en: "May tonight bring you a little peace.", zh: "愿今晚，给你一点点安宁。" },
  { en: "Your curiosity is a lantern. Follow it.", zh: "你的好奇心是一盏灯，跟着它走吧。" },
  { en: "The parts of you still growing are beautiful too.", zh: "你还在生长的那些部分，也同样美好。" },
  { en: "Small joys count. Collect them.", zh: "小小的快乐也算数，把它们收集起来吧。" },
  { en: "You can carry hope and doubt at the same time.", zh: "你可以同时怀着希望和疑问。" },
  { en: "Thank you for staying. The world is better with you in it.", zh: "谢谢你一直都在，有你的世界更好。" },
];

/** Shown once every charm in the sanctuary has been found. */
export const FINAL_BLESSING: LocalizedText = {
  en: "You found every hidden light. May you keep finding them in your own days, too.",
  zh: "你找到了所有藏起来的光。愿你在自己的日子里，也一直能找到它们。",
};

/**
 * A shuffled bag of indices: every blessing appears once before any repeats,
 * and a new round never starts with the one just shown.
 */
export function createBlessingBag(size: number, random: () => number = Math.random) {
  let bag: number[] = [];
  let last = -1;
  const refill = () => {
    bag = Array.from({ length: size }, (_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  };
  return {
    next(): number {
      if (bag.length === 0) refill();
      const value = bag.pop() as number;
      last = value;
      return value;
    },
  };
}
