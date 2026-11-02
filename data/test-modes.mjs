export const defaultMode = 'full';
export const visibleModes = [
  {id:'story',count:36,name:'故事初章',minutes:'约 6–9 分钟',desc:'在六种故事里认识自己的选择'},
  {id:'full',count:60,name:'完整来信',minutes:'约 10–15 分钟',desc:'多走一些情节，看看不同侧面'},
  {id:'extended',count:90,name:'长篇旅程',minutes:'约 15–22 分钟',desc:'留出一段时间，慢慢走完旅程'},
];
// Keep published IDs unchanged so unfinished runs and older clients retain their lengths.
export const modes = [...visibleModes,
  {id:'light',count:12}, {id:'standard',count:24}, {id:'deep',count:36},
];
