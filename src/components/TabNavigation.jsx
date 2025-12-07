const TABS = ['houses', 'students', 'preferences', 'results', 'data'];

export function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="flex border-b">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-6 py-3 font-medium capitalize transition-colors ${
            activeTab === tab
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
