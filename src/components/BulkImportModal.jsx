import { useState, useCallback } from 'react';

export function BulkImportModal({ isOpen, onClose, onImport, existingStudents }) {
  const [rawText, setRawText] = useState('');
  const [parsedNames, setParsedNames] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [step, setStep] = useState('input'); // 'input' | 'preview' | 'done'

  const resetAndClose = useCallback(() => {
    setRawText('');
    setParsedNames([]);
    setSelected(new Set());
    setStep('input');
    onClose();
  }, [onClose]);

  const parseNames = useCallback(() => {
    const lines = rawText.split('\n').filter(line => line.trim());
    const existing = new Set(
      existingStudents.map(s => `${s.firstName.trim().toLowerCase()} ${s.lastName.trim().toLowerCase()}`)
    );

    const parsed = lines.map((line, idx) => {
      const trimmed = line.trim();
      // Handle tab-separated (spreadsheet paste) - take first two columns
      const tabParts = trimmed.split('\t').map(p => p.trim());

      let firstName = '';
      let lastName = '';

      if (tabParts.length >= 2) {
        firstName = tabParts[0];
        lastName = tabParts[1];
      } else if (trimmed.includes(',')) {
        // "Last, First" format
        const [last, first] = trimmed.split(',', 2).map(p => p.trim());
        firstName = first || '';
        lastName = last || '';
      } else {
        // "First Last" format
        const spaceIdx = trimmed.indexOf(' ');
        if (spaceIdx !== -1) {
          firstName = trimmed.slice(0, spaceIdx);
          lastName = trimmed.slice(spaceIdx + 1);
        } else {
          firstName = trimmed;
        }
      }

      const key = `${firstName.trim().toLowerCase()} ${lastName.trim().toLowerCase()}`;
      const isDuplicate = existing.has(key);

      return { id: idx, firstName, lastName, isDuplicate, isValid: firstName.length > 0 };
    });

    setParsedNames(parsed);
    const validIndices = new Set(parsed.filter(p => p.isValid && !p.isDuplicate).map(p => p.id));
    setSelected(validIndices);
    setStep('preview');
  }, [rawText, existingStudents]);

  const handleImport = useCallback(() => {
    const toImport = parsedNames
      .filter(p => selected.has(p.id))
      .map(p => ({ firstName: p.firstName, lastName: p.lastName }));

    if (toImport.length > 0) {
      onImport(toImport);
    }
    setStep('done');
    setTimeout(resetAndClose, 1500);
  }, [parsedNames, selected, onImport, resetAndClose]);

  const toggleSelection = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const validIds = parsedNames.filter(p => p.isValid).map(p => p.id);
    if (selected.size === validIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(validIds));
    }
  };

  if (!isOpen) return null;

  const newCount = parsedNames.filter(p => selected.has(p.id) && !p.isDuplicate).length;
  const dupCount = parsedNames.filter(p => p.isDuplicate).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetAndClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Bulk Import Students</h3>
          <button onClick={resetAndClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {step === 'input' && (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Paste student names below, one per line. Supports formats:
              </p>
              <ul className="text-xs text-gray-500 mb-3 ml-4 list-disc">
                <li>Jane Smith (first last)</li>
                <li>Smith, Jane (last, first)</li>
                <li>Jane&#9;Smith (tab-separated, from spreadsheets)</li>
              </ul>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm resize-y"
                placeholder={"Jane Smith\nEmily Johnson\nSarah Williams"}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={resetAndClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
                <button
                  onClick={parseNames}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Parse Names
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-600">
                  {newCount} new student{newCount !== 1 ? 's' : ''} to import
                  {dupCount > 0 && <span className="text-yellow-600 ml-1">({dupCount} duplicate{dupCount !== 1 ? 's' : ''})</span>}
                </p>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selected.size === parsedNames.filter(p => p.isValid).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                  <div className="col-span-1"></div>
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">First Name</div>
                  <div className="col-span-4">Last Name</div>
                  <div className="col-span-2">Status</div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {parsedNames.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`grid grid-cols-12 gap-2 p-2 border-b text-sm items-center ${
                        !p.isValid ? 'bg-red-50' : p.isDuplicate ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelection(p.id)}
                          disabled={!p.isValid}
                          className="rounded"
                        />
                      </div>
                      <div className="col-span-1 text-gray-400">{idx + 1}</div>
                      <div className="col-span-4">{p.firstName || <span className="text-red-400 italic">empty</span>}</div>
                      <div className="col-span-4">{p.lastName || <span className="text-gray-400 italic">none</span>}</div>
                      <div className="col-span-2">
                        {!p.isValid && <span className="text-xs text-red-600 font-medium">Invalid</span>}
                        {p.isValid && p.isDuplicate && <span className="text-xs text-yellow-600 font-medium">Duplicate</span>}
                        {p.isValid && !p.isDuplicate && <span className="text-xs text-green-600 font-medium">New</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between gap-2 mt-3">
                <button onClick={() => setStep('input')} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Import {selected.size} Student{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-green-700 font-medium">Added {selected.size} student{selected.size !== 1 ? 's' : ''}!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
