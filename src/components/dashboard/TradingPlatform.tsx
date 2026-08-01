import { useState, useEffect } from 'react';
import TradingHeader from '../trading/TradingHeader';
import ShowcaseLanding from '../trading/ShowcaseLanding';
import LiveTerminal from '../trading/LiveTerminal';
import MarketsView from '../trading/MarketsView';
import AccountTypesView from '../trading/AccountTypesView';
import PlatformsView from '../trading/PlatformsView';
import ClientPortalWallet from '../trading/ClientPortalWallet';
import TradingToolsView from '../trading/TradingToolsView';
import EducationFAQView from '../trading/EducationFAQView';

export default function TradingPlatform({ user, account }: { user: any; account: any }) {
  const [activeTab, setActiveTab] = useState<string>('terminal');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [liveEquity, setLiveEquity] = useState<number>(account?.balance || 1000);
  const [selectedAccount, setSelectedAccount] = useState<any>(account);
  const [selectedAccountType, setSelectedAccountType] = useState<string>('Standard Live');

  useEffect(() => {
    if (account?.balance) {
      setLiveEquity(account.balance);
      setSelectedAccount(account);
    }
  }, [account]);

  const handleSelectSymbolToTrade = (symbol: string) => {
    setActiveTab('terminal');
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Broker Header */}
      <TradingHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        liveEquity={liveEquity}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'showcase' && (
          <ShowcaseLanding
            onStartTrading={() => setActiveTab('terminal')}
            onExploreMarkets={() => setActiveTab('markets')}
            onOpenAccount={() => setActiveTab('accounts')}
            onViewPlatforms={() => setActiveTab('platforms')}
          />
        )}

        {activeTab === 'terminal' && (
          <LiveTerminal
            user={user}
            account={account}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            onTradeSymbol={handleSelectSymbolToTrade}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountTypesView
            onSelectAccountType={(type) => {
              setSelectedAccountType(type);
              setActiveTab('wallet');
            }}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'platforms' && (
          <PlatformsView
            onLaunchWebTrader={() => setActiveTab('terminal')}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'wallet' && (
          <ClientPortalWallet
            user={user}
            account={account}
            selectedAccountType={selectedAccountType}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'tools' && (
          <TradingToolsView
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'education' && (
          <EducationFAQView
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
}
