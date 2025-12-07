import { useState, useCallback } from 'react';
import { CONFIG } from './config';
import {
  useLocalStorage,
  useAssignmentAlgorithm,
  useProjectManager,
  useStudentHelpers
} from './hooks';
import {
  HouseEditor,
  StudentList,
  PreferenceManager,
  ResultsView,
  DataManagement,
  TabNavigation
} from './components';

function App() {
  // ============================================
  // PERSISTED STATE
  // ============================================
  const [houses, setHouses] = useLocalStorage(CONFIG.STORAGE_KEYS.HOUSES, []);
  const [students, setStudents] = useLocalStorage(CONFIG.STORAGE_KEYS.STUDENTS, []);

  // ============================================
  // UI STATE
  // ============================================
  const [activeTab, setActiveTab] = useState('houses');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // ============================================
  // CUSTOM HOOKS
  // ============================================
  const { getStudentName, hasMutualPreference } = useStudentHelpers(students);

  const {
    assignments,
    stats,
    isGenerating,
    runAssignment,
    resetAssignments
  } = useAssignmentAlgorithm(students, houses, getStudentName);

  // Reset UI state (used by project manager)
  const resetUI = useCallback(() => {
    setSelectedStudentId(null);
  }, []);

  const {
    savedProjects,
    saveProject,
    loadProject,
    deleteProject,
    exportData,
    importData,
    clearAllData
  } = useProjectManager(houses, students, setHouses, setStudents, resetUI);

  // ============================================
  // HOUSE MANAGEMENT
  // ============================================
  const addHouse = useCallback(() => {
    setHouses(prev => [...prev, {
      id: Date.now(),
      name: `House ${prev.length + 1}`,
      capacity: CONFIG.DEFAULTS.HOUSE_CAPACITY
    }]);
  }, [setHouses]);

  const updateHouse = useCallback((id, field, value) => {
    setHouses(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
  }, [setHouses]);

  const removeHouse = useCallback((id) => {
    setHouses(prev => prev.filter(h => h.id !== id));
  }, [setHouses]);

  // ============================================
  // STUDENT MANAGEMENT
  // ============================================
  const addStudent = useCallback(() => {
    setStudents(prev => [...prev, {
      id: Date.now(),
      firstName: '',
      lastName: '',
      preferences: [],
      avoids: []
    }]);
  }, [setStudents]);

  const updateStudent = useCallback((id, field, value) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, [setStudents]);

  const removeStudent = useCallback((id) => {
    setStudents(prev => prev
      .filter(s => s.id !== id)
      .map(s => ({
        ...s,
        preferences: s.preferences.filter(p => p !== id),
        avoids: s.avoids.filter(a => a !== id)
      }))
    );
    if (selectedStudentId === id) setSelectedStudentId(null);
  }, [setStudents, selectedStudentId]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            🏠 W&L College Housing Assignment
          </h1>
          <p className="text-gray-600 mt-2">Optimize housing assignments based on student preferences</p>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'houses' && (
            <HouseEditor
              houses={houses}
              onAddHouse={addHouse}
              onUpdateHouse={updateHouse}
              onRemoveHouse={removeHouse}
            />
          )}

          {activeTab === 'students' && (
            <StudentList
              students={students}
              onAddStudent={addStudent}
              onUpdateStudent={updateStudent}
              onRemoveStudent={removeStudent}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferenceManager
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
              onUpdateStudents={setStudents}
              getStudentName={getStudentName}
              hasMutualPreference={hasMutualPreference}
            />
          )}

          {activeTab === 'results' && (
            <ResultsView
              students={students}
              assignments={assignments}
              stats={stats}
              isGenerating={isGenerating}
              onRunAssignment={runAssignment}
              onReset={resetAssignments}
              getStudentName={getStudentName}
            />
          )}

          {activeTab === 'data' && (
            <DataManagement
              savedProjects={savedProjects}
              onSaveProject={saveProject}
              onLoadProject={loadProject}
              onDeleteProject={deleteProject}
              onExportData={exportData}
              onImportData={importData}
              onClearAllData={clearAllData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
