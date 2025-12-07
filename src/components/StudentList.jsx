export function StudentList({ students, onAddStudent, onUpdateStudent, onRemoveStudent }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Add All Students</h2>
        <button
          onClick={onAddStudent}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          ➕ Add Student
        </button>
      </div>
      <p className="text-gray-600 mb-4">
        First, add all students with their names. Then use the Preferences tab to set their housing preferences.
      </p>
      <div className="space-y-3">
        {students.map((student, index) => (
          <div key={student.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <input
              type="text"
              value={student.firstName}
              onChange={(e) => onUpdateStudent(student.id, 'firstName', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="First name"
            />
            <input
              type="text"
              value={student.lastName}
              onChange={(e) => onUpdateStudent(student.id, 'lastName', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="Last name"
            />
            <button
              onClick={() => onRemoveStudent(student.id)}
              className="text-red-600 hover:text-red-800 px-2"
            >
              ➖
            </button>
          </div>
        ))}
        {students.length === 0 && (
          <p className="text-gray-500 text-center py-8">No students added yet</p>
        )}
      </div>
    </div>
  );
}
