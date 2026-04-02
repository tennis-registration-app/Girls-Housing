import { useState } from 'react';

export function ManualTweakView({
  tweakedAssignments,
  tweakedStats,
  changes,
  students,
  getStudentName,
  onMoveStudent,
  onSwapStudents,
  onUndo,
  moveHistory,
  tweakedResults
}) {
  const [dragStudent, setDragStudent] = useState(null);
  const [dragFromHouse, setDragFromHouse] = useState(null);
  const [dropTargetHouse, setDropTargetHouse] = useState(null);
  const [swapMode, setSwapMode] = useState(null); // { studentId, fromHouseId, toHouseId }

  const scoreDelta = changes?.scoreDelta || 0;

  const handleDragStart = (studentId, houseId) => (e) => {
    setDragStudent(studentId);
    setDragFromHouse(houseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (houseId) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetHouse(houseId);
  };

  const handleDragLeave = () => {
    setDropTargetHouse(null);
  };

  const handleDrop = (toHouseId) => (e) => {
    e.preventDefault();
    setDropTargetHouse(null);

    if (!dragStudent || !dragFromHouse || dragFromHouse === toHouseId) {
      setDragStudent(null);
      setDragFromHouse(null);
      return;
    }

    const toHouse = tweakedAssignments.find(h => h.id === toHouseId);
    if (toHouse && toHouse.students.length >= toHouse.capacity) {
      // House is full - enter swap mode
      setSwapMode({ studentId: dragStudent, fromHouseId: dragFromHouse, toHouseId });
    } else {
      onMoveStudent(dragStudent, dragFromHouse, toHouseId);
    }

    setDragStudent(null);
    setDragFromHouse(null);
  };

  const handleSwapSelect = (targetStudentId) => {
    if (!swapMode) return;
    onSwapStudents(swapMode.studentId, targetStudentId);
    setSwapMode(null);
  };

  const cancelSwapMode = () => setSwapMode(null);

  // Build set of moved student IDs for highlighting
  const movedStudentIds = new Set((changes?.moved || []).map(m => m.studentId));

  // Build set of new conflicts
  const getNewConflicts = (houseStudents) => {
    const conflicts = new Set();
    for (const sId of houseStudents) {
      const student = students.find(s => s.id === sId);
      if (!student) continue;
      for (const otherId of houseStudents) {
        if (sId === otherId) continue;
        if (student.avoids.includes(otherId)) {
          conflicts.add(sId);
          conflicts.add(otherId);
        }
        const other = students.find(s => s.id === otherId);
        if (other?.avoids.includes(sId)) {
          conflicts.add(sId);
          conflicts.add(otherId);
        }
      }
    }
    return conflicts;
  };

  return (
    <div>
      {/* Status bar */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-yellow-800">Manual Edit Mode</span>
          <span className={`font-mono text-sm ${scoreDelta > 0 ? 'text-green-700' : scoreDelta < 0 ? 'text-red-700' : 'text-gray-600'}`}>
            Score: {Math.round(tweakedStats?.totalScore || 0)}
            {scoreDelta !== 0 && (
              <span> ({scoreDelta > 0 ? '+' : ''}{Math.round(scoreDelta)})</span>
            )}
          </span>
          {changes?.moved.length > 0 && (
            <span className="text-sm text-gray-600">{changes.moved.length} student{changes.moved.length !== 1 ? 's' : ''} moved</span>
          )}
        </div>
        <button
          onClick={onUndo}
          disabled={moveHistory.length === 0}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-40"
        >
          Undo
        </button>
      </div>

      {/* Swap mode overlay */}
      {swapMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            House is full. Select a student to swap with <strong>{getStudentName(swapMode.studentId)}</strong>:
          </p>
          <div className="flex flex-wrap gap-2">
            {tweakedAssignments.find(h => h.id === swapMode.toHouseId)?.students.map(sId => (
              <button
                key={sId}
                onClick={() => handleSwapSelect(sId)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 border border-blue-300"
              >
                {getStudentName(sId)}
              </button>
            ))}
            <button onClick={cancelSwapMode} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* House cards with drag-and-drop */}
      <div className="space-y-4">
        {tweakedAssignments.map(house => {
          const conflicts = getNewConflicts(house.students);
          const isDropTarget = dropTargetHouse === house.id && dragFromHouse !== house.id;

          return (
            <div
              key={house.id}
              className={`p-4 bg-white border rounded-lg shadow transition-colors ${
                isDropTarget ? 'border-blue-400 bg-blue-50' : ''
              }`}
              onDragOver={handleDragOver(house.id)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(house.id)}
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {house.name}
                <span className={`text-sm font-normal ${house.students.length >= house.capacity ? 'text-red-600' : 'text-gray-500'}`}>
                  ({house.students.length}/{house.capacity})
                </span>
                {conflicts.size > 0 && <span className="text-red-600 text-sm">-- conflicts</span>}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {house.students.map(studentId => {
                  const isMoved = movedStudentIds.has(studentId);
                  const hasConflict = conflicts.has(studentId);
                  const result = tweakedResults?.find(r => r.studentId === studentId);

                  return (
                    <div
                      key={studentId}
                      draggable
                      onDragStart={handleDragStart(studentId, house.id)}
                      className={`p-3 rounded-lg border text-sm cursor-grab active:cursor-grabbing select-none ${
                        hasConflict ? 'bg-red-50 border-red-300' :
                        isMoved ? 'bg-blue-50 border-blue-300' :
                        result?.mutualMatches?.length > 0 ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium flex items-center gap-1">
                        {getStudentName(studentId)}
                        {isMoved && <span className="text-xs text-blue-500">(moved)</span>}
                      </div>
                      {result && (
                        <div className={`text-xs mt-1 ${result.satisfactionColor}`}>
                          {hasConflict ? '-- Conflict!' :
                           result.mutualMatches?.length > 0 ? 'Mutual match' :
                           result.topChoiceRank ? `#${result.topChoiceRank} choice met` :
                           result.preferencesMatched?.length > 0 ? 'Some preferences' : 'No preferences met'}
                        </div>
                      )}
                    </div>
                  );
                })}
                {house.students.length === 0 && (
                  <div className="col-span-full text-gray-400 italic p-2">Empty - drop students here</div>
                )}
                {house.students.length < house.capacity && house.students.length > 0 && (
                  <div className="col-span-full text-gray-300 italic text-xs p-1">
                    {house.capacity - house.students.length} spot{house.capacity - house.students.length !== 1 ? 's' : ''} available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
