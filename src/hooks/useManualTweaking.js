import { useState, useCallback, useMemo } from 'react';

export function useManualTweaking(originalSolution, students, calculateHappiness, analyzeStudentResults) {
  const [tweakedAssignments, setTweakedAssignments] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const isEditing = tweakedAssignments !== null;

  const cloneAssignment = (assignment) => assignment.map(h => ({ ...h, students: [...h.students] }));

  const startEditing = useCallback(() => {
    if (!originalSolution?.assignments) return;
    setTweakedAssignments(cloneAssignment(originalSolution.assignments));
    setMoveHistory([]);
  }, [originalSolution]);

  const moveStudentToHouse = useCallback((studentId, fromHouseId, toHouseId) => {
    setTweakedAssignments(prev => {
      if (!prev) return prev;
      const next = prev.map(h => ({ ...h, students: [...h.students] }));
      const fromHouse = next.find(h => h.id === fromHouseId);
      const toHouse = next.find(h => h.id === toHouseId);

      if (!fromHouse || !toHouse) return prev;
      if (toHouse.students.length >= toHouse.capacity) return prev;

      fromHouse.students = fromHouse.students.filter(id => id !== studentId);
      toHouse.students.push(studentId);
      return next;
    });

    setMoveHistory(prev => [...prev, { type: 'move', studentId, fromHouseId, toHouseId }]);
  }, []);

  const swapStudentsBetweenHouses = useCallback((studentAId, studentBId) => {
    setTweakedAssignments(prev => {
      if (!prev) return prev;
      const next = prev.map(h => ({ ...h, students: [...h.students] }));
      let houseA = null, houseB = null, idxA = -1, idxB = -1;

      for (const h of next) {
        const aIdx = h.students.indexOf(studentAId);
        if (aIdx !== -1) { houseA = h; idxA = aIdx; }
        const bIdx = h.students.indexOf(studentBId);
        if (bIdx !== -1) { houseB = h; idxB = bIdx; }
      }

      if (!houseA || !houseB || houseA.id === houseB.id) return prev;
      houseA.students[idxA] = studentBId;
      houseB.students[idxB] = studentAId;
      return next;
    });

    setMoveHistory(prev => [...prev, { type: 'swap', studentAId, studentBId }]);
  }, []);

  const undoLastMove = useCallback(() => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];

    setTweakedAssignments(prev => {
      if (!prev) return prev;
      const next = prev.map(h => ({ ...h, students: [...h.students] }));

      if (lastMove.type === 'swap') {
        let houseA = null, houseB = null, idxA = -1, idxB = -1;
        for (const h of next) {
          const aIdx = h.students.indexOf(lastMove.studentAId);
          if (aIdx !== -1) { houseA = h; idxA = aIdx; }
          const bIdx = h.students.indexOf(lastMove.studentBId);
          if (bIdx !== -1) { houseB = h; idxB = bIdx; }
        }
        if (houseA && houseB) {
          houseA.students[idxA] = lastMove.studentBId;
          houseB.students[idxB] = lastMove.studentAId;
        }
      } else {
        const fromHouse = next.find(h => h.id === lastMove.toHouseId);
        const toHouse = next.find(h => h.id === lastMove.fromHouseId);
        if (fromHouse && toHouse) {
          fromHouse.students = fromHouse.students.filter(id => id !== lastMove.studentId);
          toHouse.students.push(lastMove.studentId);
        }
      }
      return next;
    });

    setMoveHistory(prev => prev.slice(0, -1));
  }, [moveHistory]);

  const discardEdits = useCallback(() => {
    setTweakedAssignments(null);
    setMoveHistory([]);
  }, []);

  const getConfirmedAssignments = useCallback(() => {
    return tweakedAssignments;
  }, [tweakedAssignments]);

  // Real-time score calculations
  const tweakedStats = useMemo(() => {
    if (!tweakedAssignments || !calculateHappiness) return null;
    const raw = calculateHappiness(tweakedAssignments);
    return {
      totalScore: raw.score,
      conflicts: raw.conflicts,
      mutualFirstMatches: raw.mutualFirstMatches,
      mutualPreferences: raw.mutualPreferences,
      preferencesMet: raw.preferencesMet,
      avgScore: raw.avgScore,
      houseFirstChoices: raw.houseFirstChoices,
      houseSecondChoices: raw.houseSecondChoices,
    };
  }, [tweakedAssignments, calculateHappiness]);

  const tweakedResults = useMemo(() => {
    if (!tweakedAssignments || !analyzeStudentResults) return null;
    return analyzeStudentResults(tweakedAssignments);
  }, [tweakedAssignments, analyzeStudentResults]);

  // Diff against original
  const changes = useMemo(() => {
    if (!tweakedAssignments || !originalSolution?.assignments) return null;
    const origMap = {};
    originalSolution.assignments.forEach(h => h.students.forEach(s => origMap[s] = h.id));
    const newMap = {};
    tweakedAssignments.forEach(h => h.students.forEach(s => newMap[s] = h.id));

    const moved = [];
    for (const sId in origMap) {
      if (origMap[sId] !== newMap[sId]) {
        moved.push({ studentId: Number(sId), fromHouseId: origMap[sId], toHouseId: newMap[sId] });
      }
    }

    const origScore = originalSolution.stats?.totalScore || 0;
    const newScore = tweakedStats?.totalScore || 0;
    const scoreDelta = newScore - origScore;

    return { moved, scoreDelta };
  }, [tweakedAssignments, originalSolution, tweakedStats]);

  return {
    isEditing,
    tweakedAssignments,
    tweakedStats,
    tweakedResults,
    changes,
    moveHistory,
    startEditing,
    moveStudentToHouse,
    swapStudentsBetweenHouses,
    undoLastMove,
    discardEdits,
    getConfirmedAssignments
  };
}
