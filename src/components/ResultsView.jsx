import { CONFIG } from '../config';

export function ResultsView({
  students,
  assignments,
  stats,
  isGenerating,
  onRunAssignment,
  onReset,
  getStudentName
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Housing Assignment Results</h2>
        <div className="flex gap-2">
          <button
            onClick={onRunAssignment}
            disabled={students.length === 0 || isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
              isGenerating ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
            } disabled:opacity-50`}
          >
            {isGenerating ? '⏳' : '▶️'}
            {isGenerating ? 'Optimizing...' : (assignments.length > 0 ? 'Re-run Assignment' : 'Generate Assignment')}
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="mb-6 p-6 bg-purple-50 rounded-lg text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mb-3"></div>
          <p className="text-purple-700 font-medium">Optimizing housing assignments...</p>
          <p className="text-purple-600 text-sm mt-1">Running simulated annealing for {students.length} students</p>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Assignment Statistics</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-blue-800">{Math.round(stats.totalScore).toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Happiness Score</div>
              <div className="text-sm text-gray-700 mt-1">Avg: {stats.avgScore?.toFixed(1) || 0} per student</div>
            </div>
            <div>
              <div className="font-medium text-green-700">{stats.mutualFirstMatches || 0} Mutual 1st Choices</div>
              <div className="text-sm text-green-600">{stats.mutualPreferences || 0} Total Mutual Prefs</div>
              <div className="text-sm text-gray-600 mt-1">{stats.preferencesMet || 0} Preferences Met</div>
            </div>
            <div>
              <div className={stats.conflicts > 0 ? "font-medium text-red-700" : "font-medium text-green-700"}>
                {stats.conflicts > 0 ? `${stats.conflicts} Conflicts ⚠️` : '✓ No Conflicts'}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                🏠 {stats.houseFirstChoices || 0} got 1st choice house, {stats.houseSecondChoices || 0} got 2nd
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Best of {stats.validArrangements} runs × {stats.iterationsPerRun || CONFIG.ALGORITHM.ANNEALING_ITERATIONS} iterations
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-blue-700">
            Optimized using {stats.validArrangements} configurations × {stats.iterationsPerRun || CONFIG.ALGORITHM.ANNEALING_ITERATIONS} annealing steps each.
          </p>
        </div>
      )}

      {/* House Assignments */}
      <div className="space-y-6">
        {assignments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">🏠 Housing Assignments by House</h3>
            {assignments.map(house => (
              <HouseAssignmentCard
                key={house.id}
                house={house}
                stats={stats}
                getStudentName={getStudentName}
              />
            ))}
          </div>
        )}

        {/* Individual Results Table */}
        {stats?.individualResults && (
          <IndividualResultsTable results={stats.individualResults} />
        )}

        {assignments.length === 0 && !isGenerating && (
          <p className="text-gray-500 text-center py-8">Click "Generate Assignment" to see housing arrangements</p>
        )}
      </div>
    </div>
  );
}

function HouseAssignmentCard({ house, stats, getStudentName }) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow">
      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
        👥 {house.name} ({house.students.length}/{house.capacity})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {house.students.map(studentId => {
          const result = stats?.individualResults?.find(r => r.studentId === studentId);
          const hasAnyConflict = result?.avoidsViolated?.length > 0 || result?.avoidedBy?.length > 0;
          return (
            <div
              key={studentId}
              className={`p-3 rounded-lg border text-sm ${
                hasAnyConflict ? 'bg-red-50 border-red-200' :
                result?.mutualMatches?.length > 0 ? 'bg-green-50 border-green-200' :
                result?.topChoiceRank && result.topChoiceRank <= 3 ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="font-medium">{getStudentName(studentId)}</div>
              {result && (
                <div className={`text-xs mt-1 ${result.satisfactionColor}`}>
                  {result.avoidsViolated?.length > 0 ? '⚠️ Conflict!' :
                   result.avoidedBy?.length > 0 ? '⚠️ Avoided by roommate' :
                   result.mutualMatches?.length > 0 ? '💜 Mutual match' :
                   result.topChoiceRank ? `🎯 #${result.topChoiceRank} choice met` :
                   result.preferencesMatched?.length > 0 ? '✓ Some preferences' : '○ No preferences met'}
                  {result.housePreferenceResult === '1st' && <span className="ml-2 text-green-600">🏠 1st choice</span>}
                  {result.housePreferenceResult === '2nd' && <span className="ml-2 text-blue-600">🏠 2nd choice</span>}
                </div>
              )}
            </div>
          );
        })}
        {house.students.length === 0 && (
          <div className="col-span-full text-gray-500 italic">No assignments</div>
        )}
      </div>
    </div>
  );
}

function IndividualResultsTable({ results }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">👤 Individual Student Results</h3>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b font-medium text-sm">
          <div className="col-span-2">Student</div>
          <div className="col-span-2">House</div>
          <div className="col-span-1 text-center">House Pref</div>
          <div className="col-span-2">Satisfaction</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2">Roommate Prefs</div>
          <div className="col-span-2">Issues</div>
        </div>
        {results.map(result => (
          <div
            key={result.studentId}
            className={`grid grid-cols-12 gap-2 p-3 border-b text-sm hover:bg-gray-50 ${
              result.avoidsViolated.length > 0 ? 'bg-red-50' : ''
            }`}
          >
            <div className="col-span-2 font-medium">{result.studentName}</div>
            <div className="col-span-2">{result.houseName}</div>
            <div className="col-span-1 text-center text-xs">
              {result.housePreferenceResult === '1st' && <span className="text-green-600 font-medium">✓ 1st</span>}
              {result.housePreferenceResult === '2nd' && <span className="text-blue-600 font-medium">✓ 2nd</span>}
              {result.housePreferenceResult === 'none' && <span className="text-gray-400">✗</span>}
              {!result.housePreferenceResult && <span className="text-gray-300">-</span>}
            </div>
            <div className={`col-span-2 ${result.satisfactionColor}`}>{result.satisfactionLevel}</div>
            <div className="col-span-1 text-center font-mono">{result.individualScore}</div>
            <div className="col-span-2 text-xs">
              {result.preferencesMatched.length > 0 ? result.preferencesMatched.map((pref, idx) => (
                <span key={pref.studentId} className="inline-block mr-1">
                  #{pref.rank}{result.mutualMatches.some(m => m.studentId === pref.studentId) ? '💜' : ''}
                  {idx < result.preferencesMatched.length - 1 ? ',' : ''}
                </span>
              )) : <span className="text-gray-500">None</span>}
            </div>
            <div className="col-span-2 text-xs">
              {result.avoidsViolated.length > 0 && (
                <div className="text-red-600 font-medium">⚠️ Avoids: {result.avoidsViolated.map(a => a.studentName).join(', ')}</div>
              )}
              {result.avoidedBy?.length > 0 && (
                <div className="text-orange-600 font-medium">⚠️ Avoided by: {result.avoidedBy.map(a => a.studentName).join(', ')}</div>
              )}
              {result.avoidsViolated.length === 0 && (!result.avoidedBy || result.avoidedBy.length === 0) && (
                <span className="text-green-600">✓ None</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
