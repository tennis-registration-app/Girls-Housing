export function DataManagement({
  savedProjects,
  onSaveProject,
  onLoadProject,
  onDeleteProject,
  onExportData,
  onImportData,
  onClearAllData
}) {
  const handleSave = () => {
    const input = document.getElementById('project-name');
    if (input) {
      onSaveProject(input.value);
      input.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSaveProject(e.target.value);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Management</h2>
        <p className="text-gray-600">Save, load, import, and export your housing assignment data.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Save/Load Projects */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">💾 Save & Load Projects</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Save Current Data:</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="project-name"
                placeholder="Enter project name..."
                className="flex-1 px-3 py-2 border rounded-lg"
                onKeyPress={handleKeyPress}
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Saved Projects:</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.keys(savedProjects).length === 0 ? (
                <p className="text-gray-500 italic text-sm">No saved projects</p>
              ) : Object.entries(savedProjects).map(([name, project]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-white border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{name}</div>
                    <div className="text-xs text-gray-500">
                      {project.houses?.length || 0} houses, {project.students?.length || 0} students
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onLoadProject(name)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteProject(name)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Import/Export */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📁 Import & Export Data</h3>
          <div className="mb-4">
            <button
              onClick={onExportData}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              📤 Export All Data to File
            </button>
          </div>
          <div className="mb-4">
            <label
              htmlFor="import-file"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              📥 Import Data from File
            </label>
            <input
              type="file"
              id="import-file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
          </div>
          <div className="pt-4 border-t">
            <button
              onClick={onClearAllData}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              🗑️ Clear All Data
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          ✅ <span className="font-medium">Auto-save Enabled</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Your data is automatically saved to your browser as you work.
        </p>
      </div>
    </div>
  );
}
