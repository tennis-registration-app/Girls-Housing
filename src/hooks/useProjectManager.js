import { useCallback } from 'react';
import { CONFIG } from '../config';
import { useLocalStorage } from './useLocalStorage';

export function useProjectManager(houses, students, setHouses, setStudents, resetUI) {
  const [savedProjects, setSavedProjects] = useLocalStorage(CONFIG.STORAGE_KEYS.PROJECTS, {});

  const saveProject = useCallback((name) => {
    if (!name.trim()) {
      alert('Please enter a project name');
      return;
    }
    const projectData = {
      houses,
      students,
      timestamp: new Date().toISOString(),
      name: name.trim()
    };
    setSavedProjects(prev => ({ ...prev, [name.trim()]: projectData }));
    alert(`Project "${name}" saved successfully!`);
  }, [houses, students, setSavedProjects]);

  const loadProject = useCallback((name) => {
    const project = savedProjects[name];
    if (!project) {
      alert('Project not found');
      return;
    }
    setHouses(project.houses || []);
    setStudents(project.students || []);
    resetUI();
    alert(`Project "${name}" loaded successfully!`);
  }, [savedProjects, setHouses, setStudents, resetUI]);

  const deleteProject = useCallback((name) => {
    if (confirm(`Are you sure you want to delete project "${name}"?`)) {
      setSavedProjects(prev => {
        const newProjects = { ...prev };
        delete newProjects[name];
        return newProjects;
      });
    }
  }, [setSavedProjects]);

  const exportData = useCallback(() => {
    const data = {
      houses,
      students,
      savedProjects,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wl-housing-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [houses, students, savedProjects]);

  const importData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.houses) setHouses(data.houses);
        if (data.students) setStudents(data.students);
        if (data.savedProjects) setSavedProjects(data.savedProjects);
        resetUI();
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [setHouses, setStudents, setSavedProjects, resetUI]);

  const clearAllData = useCallback(() => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setHouses([]);
      setStudents([]);
      setSavedProjects({});
      resetUI();
      localStorage.removeItem(CONFIG.STORAGE_KEYS.HOUSES);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.PROJECTS);
      alert('All data cleared.');
    }
  }, [setHouses, setStudents, setSavedProjects, resetUI]);

  return {
    savedProjects,
    saveProject,
    loadProject,
    deleteProject,
    exportData,
    importData,
    clearAllData
  };
}
