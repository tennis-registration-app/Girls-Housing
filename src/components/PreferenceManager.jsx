import { useState } from 'react';
import { CONFIG } from '../config';

export function PreferenceManager({
  students,
  selectedStudentId,
  onSelectStudent,
  onUpdateStudents,
  getStudentName,
  hasMutualPreference
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedStudent, setDraggedStudent] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeFromPreferred = (studentId, targetId) => {
    onUpdateStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, preferences: s.preferences.filter(id => id !== targetId) } : s
    ));
  };

  const removeFromAvoid = (studentId, targetId) => {
    onUpdateStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, avoids: s.avoids.filter(id => id !== targetId) } : s
    ));
  };

  const quickAddToPreferred = (targetId) => {
    if (!selectedStudentId) return;
    onUpdateStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        if (s.preferences.includes(targetId)) {
          return { ...s, preferences: s.preferences.filter(id => id !== targetId) };
        } else if (s.preferences.length < CONFIG.MAX_PREFERENCES) {
          return { ...s, preferences: [...s.preferences, targetId], avoids: s.avoids.filter(id => id !== targetId) };
        }
      }
      return s;
    }));
  };

  const quickAddToAvoid = (targetId) => {
    if (!selectedStudentId) return;
    onUpdateStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        if (s.avoids.includes(targetId)) {
          return { ...s, avoids: s.avoids.filter(id => id !== targetId) };
        } else if (s.avoids.length < CONFIG.MAX_AVOIDS) {
          return { ...s, avoids: [...s.avoids, targetId], preferences: s.preferences.filter(id => id !== targetId) };
        }
      }
      return s;
    }));
  };

  // Drag handlers
  const handleDragStart = (e, studentId, index) => {
    setDraggedStudent({ id: studentId, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!draggedStudent || !selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    const newPreferences = [...student.preferences];
    const [movedItem] = newPreferences.splice(draggedStudent.index, 1);
    newPreferences.splice(dropIndex, 0, movedItem);
    onUpdateStudents(prev => prev.map(s =>
      s.id === selectedStudentId ? { ...s, preferences: newPreferences } : s
    ));
    setDraggedStudent(null);
  };

  if (students.length === 0) {
    return <p className="text-gray-500 text-center py-8">Add students first before setting preferences</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Student Preferences</h2>
        <p className="text-gray-600">Select a student to manage their preferences. Use drag & drop to reorder preferences.</p>
        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search students by name..."
            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Student List */}
        <div className={selectedStudentId ? "col-span-5" : "col-span-12"}>
          <h3 className="text-lg font-semibold mb-4">Students</h3>
          <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 rounded-t font-medium text-sm text-gray-700">
            <div className="col-span-6">Name</div>
            <div className="col-span-3 text-center">Preferred</div>
            <div className="col-span-3 text-center">Avoid</div>
          </div>
          <div className="border border-gray-200 rounded-b max-h-96 overflow-y-auto">
            {filteredStudents.map(student => {
              const isCompleted = student.preferences.length > 0 || student.avoids.length > 0;
              const isSelected = selectedStudentId === student.id;
              const mutualCount = student.preferences.filter(prefId => hasMutualPreference(student.id, prefId)).length;
              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className={`grid grid-cols-12 gap-2 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-100 border-blue-300' : isCompleted ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="col-span-6 font-medium flex items-center gap-2">
                    {getStudentName(student.id)}
                    {mutualCount > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">💜 {mutualCount}</span>
                    )}
                  </div>
                  <div className="col-span-3 text-center text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      student.preferences.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {student.preferences.length}
                    </span>
                  </div>
                  <div className="col-span-3 text-center text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      student.avoids.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {student.avoids.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preference Interface */}
        {selectedStudentId && (
          <div className="col-span-7">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{getStudentName(selectedStudentId)}'s Preferences</h3>
                <button onClick={() => onSelectStudent(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Available Students */}
                <div>
                  <h4 className="font-medium mb-3">Available Students</h4>
                  <p className="text-sm text-gray-600 mb-3">Click to toggle preference • Double-click to avoid</p>
                  <div className="border rounded-lg p-3 bg-white max-h-64 overflow-y-auto space-y-1">
                    {(() => {
                      const availableStudents = students.filter(s => s.id !== selectedStudentId);
                      if (availableStudents.length === 0) {
                        return <p className="text-gray-500 italic text-sm">No other students available. Add more students first.</p>;
                      }
                      const filteredAvailable = availableStudents.filter(s =>
                        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      if (filteredAvailable.length === 0) {
                        return <p className="text-gray-500 italic text-sm">No students match your search.</p>;
                      }
                      return filteredAvailable.map(s => {
                        const isPreferred = selectedStudent?.preferences.includes(s.id);
                        const isAvoided = selectedStudent?.avoids.includes(s.id);
                        const isMutual = hasMutualPreference(selectedStudentId, s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => quickAddToPreferred(s.id)}
                            onDoubleClick={(e) => { e.preventDefault(); quickAddToAvoid(s.id); }}
                            className={`p-2 rounded cursor-pointer text-sm transition-all ${
                              isPreferred ? 'bg-green-50 text-green-700 border border-green-200' :
                              isAvoided ? 'bg-red-50 text-red-700 border border-red-200' :
                              'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="font-medium flex items-center gap-2">
                              {getStudentName(s.id)}
                              {isMutual && <span className="text-xs text-purple-600">💜</span>}
                            </div>
                            {(isPreferred || isAvoided) && <div className="text-xs">{isPreferred ? '✓ Preferred' : '✗ Avoided'}</div>}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Current Selections */}
                <div>
                  <h4 className="font-medium mb-3">Current Selections</h4>
                  {/* Preferred */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-green-700 mb-2">
                      Preferred Roommates ({selectedStudent?.preferences.length || 0}/{CONFIG.MAX_PREFERENCES})
                    </h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedStudent?.preferences.map((prefId, index) => {
                        const isMutual = hasMutualPreference(selectedStudentId, prefId);
                        return (
                          <div
                            key={prefId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, prefId, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`flex items-center justify-between p-2 bg-green-50 border rounded text-sm cursor-move transition-all ${
                              dragOverIndex === index ? 'border-blue-400 bg-blue-50' : 'border-green-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">⋮⋮</span>
                              <span>{index + 1}. {getStudentName(prefId)}</span>
                              {isMutual && <span className="text-xs text-purple-600">💜</span>}
                            </div>
                            <button onClick={() => removeFromPreferred(selectedStudentId, prefId)} className="text-red-600 hover:text-red-800 text-xs px-2">✕</button>
                          </div>
                        );
                      })}
                      {selectedStudent?.preferences.length === 0 && (
                        <p className="text-gray-500 italic text-sm p-2 bg-gray-50 rounded">No preferred roommates selected</p>
                      )}
                    </div>
                  </div>
                  {/* Avoid */}
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2">
                      Students to Avoid ({selectedStudent?.avoids.length || 0}/{CONFIG.MAX_AVOIDS})
                    </h5>
                    <div className="space-y-1">
                      {selectedStudent?.avoids.map(avoidId => (
                        <div key={avoidId} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <span>{getStudentName(avoidId)}</span>
                          <button onClick={() => removeFromAvoid(selectedStudentId, avoidId)} className="text-red-600 hover:text-red-800 text-xs">✕</button>
                        </div>
                      ))}
                      {selectedStudent?.avoids.length === 0 && (
                        <p className="text-gray-500 italic text-sm p-2 bg-gray-50 rounded">No students to avoid selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button onClick={() => onSelectStudent(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Done with this student
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
