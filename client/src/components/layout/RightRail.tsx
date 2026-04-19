import { useTaskStore } from '../../stores/taskStore';
import CountdownTimer from '../bts/CountdownTimer';
import MemberSelector from '../bts/MemberSelector';

const KOREAN_WORDS = [
  { korean: '보라해', romanization: 'Borahae', english: 'I purple you / lasting love', btsSong: 'Singularity' },
  { korean: '봄', romanization: 'Bom', english: 'Spring', btsSong: 'Spring Day' },
  { korean: '별', romanization: 'Byeol', english: 'Star', btsSong: 'Mikrokosmos' },
  { korean: '빛', romanization: 'Bit', english: 'Light', btsSong: 'Mikrokosmos' },
  { korean: '꿈', romanization: 'Kkum', english: 'Dream', btsSong: 'Dream Glow' },
  { korean: '화양연화', romanization: 'Hwayangnyeonhwa', english: 'Most beautiful moment in life', btsSong: 'I Need U' },
  { korean: '마음', romanization: 'Maeum', english: 'Heart / Mind', btsSong: 'Boy In Luv' },
  { korean: '달', romanization: 'Dal', english: 'Moon', btsSong: 'Moon' },
  { korean: '바다', romanization: 'Bada', english: 'Ocean / Sea', btsSong: 'Sea' },
  { korean: '청춘', romanization: 'Cheonchun', english: 'Youth', btsSong: 'Young Forever' },
  { korean: '방탄', romanization: 'Bangtan', english: 'Bulletproof', btsSong: 'N.O' },
  { korean: '사랑해', romanization: 'Saranghae', english: 'I love you', btsSong: 'Boy With Luv' },
  { korean: '행복', romanization: 'Haengbok', english: 'Happiness', btsSong: 'Trivia: Love' },
  { korean: '나비', romanization: 'Nabi', english: 'Butterfly', btsSong: 'Butterfly' },
  { korean: '길', romanization: 'Gil', english: 'Road / Path', btsSong: 'Road/Path' },
  { korean: '하늘', romanization: 'Haneul', english: 'Sky', btsSong: 'Airplane pt.2' },
  { korean: '고마워', romanization: 'Gomawo', english: 'Thank you (informal)', btsSong: 'Telepathy' },
  { korean: '기다려', romanization: 'Gidaryeo', english: 'Wait for me', btsSong: 'Spring Day' },
  { korean: '목소리', romanization: 'Moksolee', english: 'Voice', btsSong: 'Singularity' },
  { korean: '우리', romanization: 'Uri', english: 'We / Us / Our', btsSong: 'We Are Bulletproof: The Eternal' },
];

export default function RightRail() {
  const tasks = useTaskStore((s) => s.tasks);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const urgentTasks = tasks.filter(t => t.quadrant === 1 && t.status !== 'completed').length;

  const wordOfDay = KOREAN_WORDS[Math.floor(Date.now() / 86400000) % KOREAN_WORDS.length];

  return (
    <aside className="w-80 bg-gradient-to-b from-[#1a0a35] to-[#0f0520] border-l border-lavender/30 min-h-screen flex flex-col overflow-y-auto">
      {/* Countdown Timer */}
      <div className="p-4 border-b border-border">
        <CountdownTimer />
      </div>

      {/* Member Selector */}
      <div className="p-4 border-b border-border">
        <MemberSelector />
      </div>

      {/* Task Summary */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-lavender mb-3">Task Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1e0a40] rounded-lg p-3 border border-bts-purple/40">
            <p className="text-xs text-lavender">Total</p>
            <p className="text-lg font-bold text-gold">{totalTasks}</p>
          </div>
          <div className="bg-[#1e0a40] rounded-lg p-3 border border-bts-purple/40">
            <p className="text-xs text-lavender">Pending</p>
            <p className="text-lg font-bold text-cream">{pendingTasks}</p>
          </div>
          <div className="bg-[#1e0a40] rounded-lg p-3 border border-bts-purple/40">
            <p className="text-xs text-lavender">Completed</p>
            <p className="text-lg font-bold text-green-400">{completedTasks}</p>
          </div>
          <div className="bg-[#1e0a40] rounded-lg p-3 border border-bts-purple/40">
            <p className="text-xs text-lavender">Urgent</p>
            <p className="text-lg font-bold text-red-400">{urgentTasks}</p>
          </div>
        </div>
      </div>

      {/* Korean Word of the Day */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-semibold text-lavender mb-3">오늘의 단어</h3>
        <div className="bg-[#1e0a40] rounded-lg p-4 border border-bts-purple/40 space-y-3">
          <p className="text-3xl font-bold text-gold text-center">{wordOfDay.korean}</p>
          <div className="space-y-1.5">
            <p className="text-sm text-lavender"><span className="font-semibold text-cream">Romanization:</span> {wordOfDay.romanization}</p>
            <p className="text-sm text-cream"><span className="font-semibold">English:</span> {wordOfDay.english}</p>
            <p className="text-xs text-lavender italic"><span className="font-semibold not-italic text-lavender">From:</span> "{wordOfDay.btsSong}"</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
