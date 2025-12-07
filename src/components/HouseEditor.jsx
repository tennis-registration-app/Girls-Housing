import { CONFIG } from '../config';

export function HouseEditor({ houses, onAddHouse, onUpdateHouse, onRemoveHouse }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Available Houses</h2>
        <button
          onClick={onAddHouse}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Add House
        </button>
      </div>
      <div className="space-y-3">
        {houses.map(house => (
          <div key={house.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={house.name}
              onChange={(e) => onUpdateHouse(house.id, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="House name"
            />
            <div className="flex items-center gap-2">
              <span>Capacity:</span>
              <input
                type="number"
                value={house.capacity}
                onChange={(e) => onUpdateHouse(house.id, 'capacity', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border rounded-lg"
                min="1"
                max="20"
              />
            </div>
            <button
              onClick={() => onRemoveHouse(house.id)}
              className="text-red-600 hover:text-red-800"
            >
              ➖
            </button>
          </div>
        ))}
        {houses.length === 0 && (
          <p className="text-gray-500 text-center py-8">No houses added yet</p>
        )}
      </div>
    </div>
  );
}
