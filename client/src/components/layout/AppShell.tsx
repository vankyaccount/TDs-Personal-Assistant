import Sidebar from './Sidebar';
import Header from './Header';
import RightRail from './RightRail';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <RightRail />
      </div>
    </div>
  );
}
