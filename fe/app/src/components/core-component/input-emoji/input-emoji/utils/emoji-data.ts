export interface Emoji {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: Emoji[];
}

export const EMOJI_DATA: EmojiCategory[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      { emoji: "😀", name: "grinning face", keywords: ["smile", "happy"] },
      { emoji: "😃", name: "grinning face with big eyes", keywords: ["smile", "happy"] },
      { emoji: "😄", name: "grinning face with smiling eyes", keywords: ["smile", "happy"] },
      { emoji: "😁", name: "beaming face with smiling eyes", keywords: ["smile", "happy"] },
      { emoji: "😆", name: "grinning squinting face", keywords: ["smile", "happy"] },
      { emoji: "😅", name: "grinning face with sweat", keywords: ["smile", "happy", "nervous"] },
      { emoji: "😂", name: "face with tears of joy", keywords: ["laugh", "happy"] },
      { emoji: "🤣", name: "rolling on the floor laughing", keywords: ["laugh", "happy"] },
      { emoji: "😊", name: "smiling face with smiling eyes", keywords: ["smile", "happy"] },
      { emoji: "😇", name: "smiling face with halo", keywords: ["angel", "good"] },
      { emoji: "🙂", name: "slightly smiling face", keywords: ["smile"] },
      { emoji: "🙃", name: "upside-down face", keywords: ["ironic", "joke"] },
      { emoji: "😉", name: "winking face", keywords: ["wink"] },
      { emoji: "😌", name: "relieved face", keywords: ["peace", "relaxed"] },
      { emoji: "😍", name: "smiling face with heart-eyes", keywords: ["love", "heart"] },
      { emoji: "🥰", name: "smiling face with hearts", keywords: ["love", "affection"] },
      { emoji: "😘", name: "face blowing a kiss", keywords: ["kiss", "love"] },
      { emoji: "😗", name: "kissing face", keywords: ["kiss"] },
      { emoji: "😋", name: "face savoring food", keywords: ["yummy", "tasty"] },
      { emoji: "😛", name: "face with tongue", keywords: ["joke"] },
    ],
  },
  {
    name: "Animals",
    icon: "🐶",
    emojis: [
      { emoji: "🐶", name: "dog face", keywords: ["dog", "puppy", "pet"] },
      { emoji: "🐱", name: "cat face", keywords: ["cat", "kitty", "pet"] },
      { emoji: "🐭", name: "mouse face", keywords: ["mouse"] },
      { emoji: "🐹", name: "hamster face", keywords: ["hamster"] },
      { emoji: "🐰", name: "rabbit face", keywords: ["rabbit", "bunny"] },
      { emoji: "🦊", name: "fox face", keywords: ["fox"] },
      { emoji: "🐻", name: "bear face", keywords: ["bear"] },
      { emoji: "🐼", name: "panda face", keywords: ["panda"] },
      { emoji: "🐨", name: "koala", keywords: ["koala"] },
      { emoji: "🐯", name: "tiger face", keywords: ["tiger"] },
      { emoji: "🦁", name: "lion face", keywords: ["lion"] },
      { emoji: "🐮", name: "cow face", keywords: ["cow"] },
      { emoji: "🐷", name: "pig face", keywords: ["pig"] },
      { emoji: "🐸", name: "frog face", keywords: ["frog"] },
      { emoji: "🐒", name: "monkey", keywords: ["monkey"] },
      { emoji: "🐥", name: "front-facing baby chick", keywords: ["bird", "chicken"] },
    ],
  },
  {
    name: "Food",
    icon: "🍎",
    emojis: [
      { emoji: "🍎", name: "red apple", keywords: ["fruit", "apple"] },
      { emoji: "🍐", name: "pear", keywords: ["fruit"] },
      { emoji: "🍊", name: "tangerine", keywords: ["fruit", "orange"] },
      { emoji: "🍋", name: "lemon", keywords: ["fruit"] },
      { emoji: "🍌", name: "banana", keywords: ["fruit"] },
      { emoji: "🍉", name: "watermelon", keywords: ["fruit"] },
      { emoji: "🍇", name: "grapes", keywords: ["fruit"] },
      { emoji: "🍓", name: "strawberry", keywords: ["fruit"] },
      { emoji: "🫐", name: "blueberries", keywords: ["fruit"] },
      { emoji: "🍈", name: "melon", keywords: ["fruit"] },
      { emoji: "🍒", name: "cherries", keywords: ["fruit"] },
      { emoji: "🍑", name: "peach", keywords: ["fruit"] },
      { emoji: "🥭", name: "mango", keywords: ["fruit"] },
      { emoji: "🍍", name: "pineapple", keywords: ["fruit"] },
      { emoji: "🥥", name: "coconut", keywords: ["fruit"] },
      { emoji: "🥝", name: "kiwi fruit", keywords: ["fruit"] },
      { emoji: "🍅", name: "tomato", keywords: ["vegetable"] },
      { emoji: "🍕", name: "pizza", keywords: ["junk food"] },
      { emoji: "🍔", name: "hamburger", keywords: ["burger"] },
      { emoji: "🍟", name: "french fries", keywords: ["junk food"] },
    ],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: [
      { emoji: "❤️", name: "red heart", keywords: ["love", "heart"] },
      { emoji: "🧡", name: "orange heart", keywords: ["love", "heart"] },
      { emoji: "💛", name: "yellow heart", keywords: ["love", "heart"] },
      { emoji: "💚", name: "green heart", keywords: ["love", "heart"] },
      { emoji: "💙", name: "blue heart", keywords: ["love", "heart"] },
      { emoji: "💜", name: "purple heart", keywords: ["love", "heart"] },
      { emoji: "🖤", name: "black heart", keywords: ["love", "heart"] },
      { emoji: "🤍", name: "white heart", keywords: ["love", "heart"] },
      { emoji: "🤎", name: "brown heart", keywords: ["love", "heart"] },
      { emoji: "💔", name: "broken heart", keywords: ["sad", "heart"] },
      { emoji: "❣️", name: "heart exclamation", keywords: ["love", "heart"] },
      { emoji: "💕", name: "two hearts", keywords: ["love", "heart"] },
      { emoji: "💞", name: "revolving hearts", keywords: ["love", "heart"] },
      { emoji: "💓", name: "beating heart", keywords: ["love", "heart"] },
      { emoji: "💗", name: "growing heart", keywords: ["love", "heart"] },
      { emoji: "💖", name: "sparkling heart", keywords: ["love", "heart"] },
    ],
  },
];
