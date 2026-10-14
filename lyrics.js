/*
  Timing config for "For my Angel".

  lyrics   : the lines to show, each with the second it should appear.
             Example: { t: 24.5, text: "your line here" }
             (Add the song's lyrics yourself, or use sync mode: open index.html?sync)
  heartWord: the word(s) that build the big red heart.
  hearts   : start / end second of each heart moment (adjust to match the song).
  endAt    : second when "From your prince♡~~" appears. null = 14s before the song ends.
*/
window.CONFIG = {
  heartWord: "love you",
  hearts: [
    { start: 140.43, end: 154.82 }, // first "love you" heart
    { start: 293.78, end: 305.84 }  // second "love you" heart
  ],
  endAt: null,
  "lyrics": [
  {
   "t": 68.97,
   "text": "You are my angel"
  },
  {
   "t": 86.86,
   "text": "Come from way above"
  },
  {
   "t": 92.3,
   "text": "To bring me love, to bring me love"
  },
  {
   "t": 118.38,
   "text": "Her eyes"
  },
  {
   "t": 121.43,
   "text": "She's on the dark side"
  },
  {
   "t": 127.26,
   "text": "Neutralize every man in sight, every man in sight"
  },
  {
   "t": 194.28,
   "text": "You are my angel"
  },
  {
   "t": 212.06,
   "text": "Come from way above"
  }
 ]
};
