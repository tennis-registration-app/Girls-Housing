export function SolutionComparer({ solutions, selectedIndex, onSelectSolution }) {
  if (solutions.length <= 1) return null;

  const metrics = [
    { key: 'totalScore', label: 'Total Score', format: v => Math.round(v).toLocaleString() },
    { key: 'avgScore', label: 'Avg / Student', format: v => v?.toFixed(1) || '0' },
    { key: 'mutualFirstMatches', label: 'Mutual 1st Choices', format: v => v || 0 },
    { key: 'mutualPreferences', label: 'Mutual Any Prefs', format: v => v || 0 },
    { key: 'preferencesMet', label: 'Preferences Met', format: v => v || 0 },
    { key: 'conflicts', label: 'Conflicts', format: v => v || 0, isNegative: true },
    { key: 'houseFirstChoices', label: 'House 1st Choice', format: v => v || 0 },
    { key: 'houseSecondChoices', label: 'House 2nd Choice', format: v => v || 0 },
  ];

  // Find best value per metric for highlighting
  const bestValues = {};
  for (const metric of metrics) {
    const values = solutions.map(s => s.stats?.[metric.key] || 0);
    bestValues[metric.key] = metric.isNegative ? Math.min(...values) : Math.max(...values);
  }

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-800 mb-3">Compare Solutions</h3>

      {/* Solution tabs */}
      <div className="flex gap-1 mb-3">
        {solutions.map((sol, idx) => (
          <button
            key={sol.id}
            onClick={() => onSelectSolution(idx)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              idx === selectedIndex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sol.label}
            <span className={`ml-1 text-xs ${idx === selectedIndex ? 'text-blue-200' : 'text-gray-400'}`}>
              ({Math.round(sol.stats?.totalScore || 0)})
            </span>
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-2 font-medium text-gray-600 min-w-[140px]">Metric</th>
                {solutions.map((sol, idx) => (
                  <th
                    key={sol.id}
                    className={`text-center p-2 font-medium min-w-[90px] ${
                      idx === selectedIndex ? 'bg-blue-50 text-blue-800' : 'text-gray-600'
                    }`}
                  >
                    {sol.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.key} className="border-b last:border-b-0">
                  <td className="p-2 text-gray-700">{metric.label}</td>
                  {solutions.map((sol, idx) => {
                    const value = sol.stats?.[metric.key] || 0;
                    const isBest = value === bestValues[metric.key] && solutions.length > 1;
                    return (
                      <td
                        key={sol.id}
                        className={`text-center p-2 font-mono ${
                          idx === selectedIndex ? 'bg-blue-50' : ''
                        } ${isBest ? (metric.isNegative ? 'text-green-700 font-semibold' : 'text-green-700 font-semibold') : ''} ${
                          metric.isNegative && value > 0 ? 'text-red-600' : ''
                        }`}
                      >
                        {metric.format(value)}
                        {isBest && solutions.filter(s => (s.stats?.[metric.key] || 0) === value).length < solutions.length && (
                          <span className="ml-1 text-xs text-green-500">*</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-1">* = best among solutions. Select a solution tab to view its details below.</p>
    </div>
  );
}
