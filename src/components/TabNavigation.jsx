const TABS = ['houses', 'students', 'preferences', 'results', 'data'];

export function TabNavigation({ activeTab, onTabChange, badges }) {
  return (
    <div className="flex border-b">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-6 py-3 font-medium capitalize transition-colors flex items-center gap-1.5 ${
            activeTab === tab
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab}
          {badges?.[tab] != null && badges[tab] > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {badges[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
