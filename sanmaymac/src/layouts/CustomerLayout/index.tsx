import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export const CustomerLayout = ({
  children,
  hideQuickAction = false,
  hideFooter = false,
  fullHeightMain = false,
}: {
  children: ReactNode;
  hideQuickAction?: boolean;
  hideFooter?: boolean;
  fullHeightMain?: boolean;
}) => {
  return (
    <div className={`flex flex-col bg-background ${fullHeightMain ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header />
      <main className={`${fullHeightMain ? 'flex-1 min-h-0 pt-20' : 'flex-grow pt-20'}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}

      {!hideQuickAction && (
        <Link to="/create-tender">
          <button className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:scale-110 hover:from-orange-700 hover:to-orange-600 active:scale-95 transition-all z-40 group">
            <span className="material-symbols-outlined text-3xl">add</span>
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              Đăng yêu cầu ngay
            </span>
          </button>
        </Link>
      )}
    </div>
  );
};
