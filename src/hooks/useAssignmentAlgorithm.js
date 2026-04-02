import { useState, useCallback, useMemo } from 'react';
import { CONFIG } from '../config';

// Simple seeded random number generator (LCG)
function seededRandom(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

export function useAssignmentAlgorithm(students, houses, getStudentName) {
  const [solutions, setSolutions] = useState([]);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Convenience getters for selected solution (backward compatible)
  const assignments = useMemo(
    () => solutions[selectedSolutionIndex]?.assignments || [],
    [solutions, selectedSolutionIndex]
  );
  const stats = useMemo(
    () => solutions[selectedSolutionIndex]?.stats || null,
    [solutions, selectedSolutionIndex]
  );

  const findMutualFirstPreferences = useCallback(() => {
    const mutualPairs = [];
    for (let i = 0; i < students.length; i++) {
      const studentA = students[i];
      if (studentA.preferences.length === 0) continue;
      const firstChoice = studentA.preferences[0];
      const studentB = students.find(s => s.id === firstChoice);
      if (studentB && studentB.preferences.length > 0 && studentB.preferences[0] === studentA.id) {
        const pairExists = mutualPairs.some(pair =>
          (pair[0] === studentA.id && pair[1] === studentB.id) || (pair[0] === studentB.id && pair[1] === studentA.id)
        );
        if (!pairExists) mutualPairs.push([studentA.id, studentB.id]);
      }
    }
    return mutualPairs;
  }, [students]);

  const calculateHappiness = useCallback((assignment) => {
    let totalScore = 0, conflicts = 0, mutualFirstMatches = 0, mutualPreferences = 0, preferencesMet = 0;
    let houseFirstChoices = 0, houseSecondChoices = 0;

    for (const house of assignment) {
      for (let i = 0; i < house.students.length; i++) {
        const student = students.find(s => s.id === house.students[i]);
        if (!student) continue;

        const housePrefs = student.housePreferences || [];
        if (housePrefs[0] === house.id) {
          totalScore += CONFIG.SCORING.HOUSE_FIRST_CHOICE_SCORE;
          houseFirstChoices++;
        } else if (housePrefs[1] === house.id) {
          totalScore += CONFIG.SCORING.HOUSE_SECOND_CHOICE_SCORE;
          houseSecondChoices++;
        }

        for (let j = 0; j < house.students.length; j++) {
          if (i === j) continue;
          const roommateId = house.students[j];
          if (student.avoids.includes(roommateId)) {
            conflicts++;
            totalScore -= CONFIG.SCORING.AVOID_CONFLICT_PENALTY;
          }
        }

        for (let j = 0; j < house.students.length; j++) {
          if (i === j) continue;
          const roommateId = house.students[j];
          const prefIndex = student.preferences.indexOf(roommateId);
          if (prefIndex !== -1) {
            preferencesMet++;
            const baseScore = CONFIG.SCORING.BASE_PREFERENCE_SCORE * Math.pow(CONFIG.SCORING.PREFERENCE_DECAY_RATE, prefIndex);
            const roommate = students.find(s => s.id === roommateId);
            const mutualPrefIndex = roommate?.preferences.indexOf(student.id);
            if (mutualPrefIndex !== -1) {
              if (prefIndex === 0 && mutualPrefIndex === 0) {
                totalScore += baseScore * CONFIG.SCORING.MUTUAL_FIRST_MULTIPLIER;
                mutualFirstMatches++;
              } else {
                totalScore += baseScore * CONFIG.SCORING.MUTUAL_ANY_MULTIPLIER;
                mutualPreferences++;
              }
            } else {
              totalScore += baseScore;
            }
          }
        }
      }
    }
    return { score: totalScore, conflicts, mutualFirstMatches, mutualPreferences, preferencesMet, houseFirstChoices, houseSecondChoices, avgScore: totalScore / students.length };
  }, [students]);

  const analyzeStudentResults = useCallback((assignment) => {
    const results = [];
    for (const house of assignment) {
      for (const studentId of house.students) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;
        const roommates = house.students.filter(id => id !== studentId);
        let individualScore = 0, preferencesMatched = [], avoidsViolated = [], avoidedBy = [], mutualMatches = [], topChoiceRank = null;

        const housePrefs = student.housePreferences || [];
        let housePreferenceResult = null;
        if (housePrefs[0] === house.id) {
          housePreferenceResult = '1st';
          individualScore += CONFIG.SCORING.HOUSE_FIRST_CHOICE_SCORE;
        } else if (housePrefs[1] === house.id) {
          housePreferenceResult = '2nd';
          individualScore += CONFIG.SCORING.HOUSE_SECOND_CHOICE_SCORE;
        } else if (housePrefs.length > 0 && (housePrefs[0] || housePrefs[1])) {
          housePreferenceResult = 'none';
        }

        for (const roommateId of roommates) {
          const prefIndex = student.preferences.indexOf(roommateId);
          if (prefIndex !== -1) {
            preferencesMatched.push({ studentId: roommateId, studentName: getStudentName(roommateId), rank: prefIndex + 1 });
            if (topChoiceRank === null || prefIndex < topChoiceRank) topChoiceRank = prefIndex + 1;
            const roommate = students.find(s => s.id === roommateId);
            if (roommate?.preferences.includes(studentId)) {
              mutualMatches.push({ studentId: roommateId, studentName: getStudentName(roommateId), mutual: true });
            }
            individualScore += CONFIG.SCORING.BASE_PREFERENCE_SCORE * Math.pow(CONFIG.SCORING.PREFERENCE_DECAY_RATE, prefIndex);
          }
        }

        for (const roommateId of roommates) {
          if (student.avoids.includes(roommateId)) {
            avoidsViolated.push({ studentId: roommateId, studentName: getStudentName(roommateId) });
            individualScore -= CONFIG.SCORING.AVOID_CONFLICT_PENALTY;
          }
          const roommate = students.find(s => s.id === roommateId);
          if (roommate?.avoids.includes(studentId)) {
            avoidedBy.push({ studentId: roommateId, studentName: getStudentName(roommateId) });
          }
        }

        let satisfactionLevel = 'Excellent', satisfactionColor = 'text-green-700';
        if (avoidsViolated.length > 0 || avoidedBy.length > 0) {
          satisfactionLevel = avoidsViolated.length > 0 ? 'Poor' : 'Awkward';
          satisfactionColor = 'text-red-700';
        } else if (mutualMatches.length > 0) {
          satisfactionLevel = 'Excellent'; satisfactionColor = 'text-green-700';
        } else if (topChoiceRank && topChoiceRank <= 3) {
          satisfactionLevel = 'Very Good'; satisfactionColor = 'text-green-600';
        } else if (preferencesMatched.length > 0) {
          satisfactionLevel = 'Good'; satisfactionColor = 'text-yellow-600';
        } else {
          satisfactionLevel = 'Fair'; satisfactionColor = 'text-gray-600';
        }

        results.push({
          studentId, studentName: getStudentName(studentId), houseName: house.name, houseId: house.id,
          individualScore: Math.round(individualScore), preferencesMatched, avoidsViolated, avoidedBy,
          mutualMatches, topChoiceRank, satisfactionLevel, satisfactionColor,
          totalPreferences: student.preferences.length, totalAvoids: student.avoids.length,
          housePreferenceResult, housePreferences: housePrefs
        });
      }
    }
    return results.sort((a, b) => b.individualScore - a.individualScore);
  }, [students, getStudentName]);

  const cloneAssignment = (assignment) => assignment.map(h => ({ ...h, students: [...h.students] }));

  const swapStudents = (assignment, house1Idx, student1Idx, house2Idx, student2Idx) => {
    const newAssignment = cloneAssignment(assignment);
    const student1 = newAssignment[house1Idx].students[student1Idx];
    const student2 = newAssignment[house2Idx].students[student2Idx];
    newAssignment[house1Idx].students[student1Idx] = student2;
    newAssignment[house2Idx].students[student2Idx] = student1;
    return newAssignment;
  };

  const cycleSwapStudents = (assignment, h1Idx, s1Idx, h2Idx, s2Idx, h3Idx, s3Idx) => {
    const newAssignment = cloneAssignment(assignment);
    const student1 = newAssignment[h1Idx].students[s1Idx];
    const student2 = newAssignment[h2Idx].students[s2Idx];
    const student3 = newAssignment[h3Idx].students[s3Idx];
    newAssignment[h2Idx].students[s2Idx] = student1;
    newAssignment[h3Idx].students[s3Idx] = student2;
    newAssignment[h1Idx].students[s1Idx] = student3;
    return newAssignment;
  };

  const moveStudent = (assignment, fromHouseIdx, studentIdx, toHouseIdx) => {
    const newAssignment = cloneAssignment(assignment);
    const student = newAssignment[fromHouseIdx].students[studentIdx];
    newAssignment[fromHouseIdx].students.splice(studentIdx, 1);
    newAssignment[toHouseIdx].students.push(student);
    return newAssignment;
  };

  // Preference-aware swap: pick a dissatisfied student, try to move them toward preferred roommates
  const smartSwap = useCallback((assignment) => {
    const flatStudents = assignment.flatMap((h, hIdx) =>
      h.students.map((sId, sIdx) => ({ houseIdx: hIdx, studentIdx: sIdx, studentId: sId }))
    );
    if (flatStudents.length === 0) return null;

    const picked = flatStudents[Math.floor(Math.random() * flatStudents.length)];
    const student = students.find(s => s.id === picked.studentId);
    if (!student || student.preferences.length === 0) return null;

    // Target one of their top-3 preferred students
    const targetPrefId = student.preferences[Math.floor(Math.random() * Math.min(3, student.preferences.length))];
    let targetHouseIdx = -1;
    for (let h = 0; h < assignment.length; h++) {
      if (assignment[h].students.includes(targetPrefId)) {
        targetHouseIdx = h;
        break;
      }
    }

    if (targetHouseIdx === -1 || targetHouseIdx === picked.houseIdx) return null;

    // Find someone in the target house to swap with (not the preferred student)
    const otherStudents = assignment[targetHouseIdx].students
      .map((sId, idx) => ({ sId, idx }))
      .filter(s => s.sId !== targetPrefId);

    if (otherStudents.length === 0) return null;
    const swapTarget = otherStudents[Math.floor(Math.random() * otherStudents.length)];

    return swapStudents(assignment, picked.houseIdx, picked.studentIdx, targetHouseIdx, swapTarget.idx);
  }, [students]);

  const optimizeAssignment = useCallback((initialAssignment, iterations) => {
    let currentAssignment = cloneAssignment(initialAssignment);
    let currentScore = calculateHappiness(currentAssignment).score;
    let bestAssignment = cloneAssignment(currentAssignment);
    let bestScore = currentScore;
    let temperature = CONFIG.ALGORITHM.INITIAL_TEMPERATURE;
    const coolingRate = CONFIG.ALGORITHM.COOLING_RATE;
    let bestTemperature = temperature;

    for (let i = 0; i < iterations; i++) {
      // Periodic reheat to escape local optima
      if (i > 0 && i % CONFIG.ALGORITHM.REHEAT_INTERVAL === 0) {
        temperature = Math.max(temperature, bestTemperature * CONFIG.ALGORITHM.REHEAT_FACTOR);
      }

      let newAssignment = null;
      const rand = Math.random();

      if (rand < CONFIG.ALGORITHM.SWAP_PROBABILITY) {
        // Standard 2-way swap
        const house1Idx = Math.floor(Math.random() * currentAssignment.length);
        const house2Idx = Math.floor(Math.random() * currentAssignment.length);
        if (house1Idx === house2Idx || currentAssignment[house1Idx].students.length === 0 || currentAssignment[house2Idx].students.length === 0) continue;
        const student1Idx = Math.floor(Math.random() * currentAssignment[house1Idx].students.length);
        const student2Idx = Math.floor(Math.random() * currentAssignment[house2Idx].students.length);
        newAssignment = swapStudents(currentAssignment, house1Idx, student1Idx, house2Idx, student2Idx);

      } else if (rand < CONFIG.ALGORITHM.SWAP_PROBABILITY + CONFIG.ALGORITHM.CYCLE_PROBABILITY) {
        // 3-way cycle swap
        if (currentAssignment.length < 3) continue;
        const houseIndices = [];
        let attempts = 0;
        while (houseIndices.length < 3 && attempts < 20) {
          const idx = Math.floor(Math.random() * currentAssignment.length);
          if (!houseIndices.includes(idx) && currentAssignment[idx].students.length > 0) {
            houseIndices.push(idx);
          }
          attempts++;
        }
        if (houseIndices.length < 3) continue;
        const [h1, h2, h3] = houseIndices;
        const s1 = Math.floor(Math.random() * currentAssignment[h1].students.length);
        const s2 = Math.floor(Math.random() * currentAssignment[h2].students.length);
        const s3 = Math.floor(Math.random() * currentAssignment[h3].students.length);
        newAssignment = cycleSwapStudents(currentAssignment, h1, s1, h2, s2, h3, s3);

      } else if (rand < CONFIG.ALGORITHM.SWAP_PROBABILITY + CONFIG.ALGORITHM.CYCLE_PROBABILITY + CONFIG.ALGORITHM.SMART_SWAP_PROBABILITY) {
        // Preference-aware swap
        newAssignment = smartSwap(currentAssignment);

      } else {
        // Single student move
        const fromHouseIdx = Math.floor(Math.random() * currentAssignment.length);
        if (currentAssignment[fromHouseIdx].students.length <= 1) continue;
        const availableHouses = currentAssignment
          .map((h, idx) => ({ idx, hasCapacity: h.students.length < h.capacity }))
          .filter(h => h.hasCapacity && h.idx !== fromHouseIdx);
        if (availableHouses.length === 0) continue;
        const toHouseIdx = availableHouses[Math.floor(Math.random() * availableHouses.length)].idx;
        const studentIdx = Math.floor(Math.random() * currentAssignment[fromHouseIdx].students.length);
        newAssignment = moveStudent(currentAssignment, fromHouseIdx, studentIdx, toHouseIdx);
      }

      if (!newAssignment) continue;

      const newScore = calculateHappiness(newAssignment).score;
      const delta = newScore - currentScore;
      const acceptProbability = delta > 0 ? 1 : Math.exp(delta / temperature);

      if (Math.random() < acceptProbability) {
        currentAssignment = newAssignment;
        currentScore = newScore;
        if (newScore > bestScore) {
          bestAssignment = cloneAssignment(newAssignment);
          bestScore = newScore;
          bestTemperature = temperature;
        }
      }
      temperature *= coolingRate;
    }
    return bestAssignment;
  }, [calculateHappiness, smartSwap]);

  // Greedy hill-climbing polish: try all pairwise swaps, accept only improvements
  const greedyPolish = useCallback((assignment) => {
    let improved = true;
    let current = cloneAssignment(assignment);
    let currentScore = calculateHappiness(current).score;

    while (improved) {
      improved = false;
      const flatStudents = current.flatMap((h, hIdx) =>
        h.students.map((sId, sIdx) => ({ houseIdx: hIdx, studentIdx: sIdx }))
      );

      for (let i = 0; i < flatStudents.length && !improved; i++) {
        for (let j = i + 1; j < flatStudents.length && !improved; j++) {
          const a = flatStudents[i], b = flatStudents[j];
          if (a.houseIdx === b.houseIdx) continue;

          const candidate = swapStudents(current, a.houseIdx, a.studentIdx, b.houseIdx, b.studentIdx);
          const candidateScore = calculateHappiness(candidate).score;
          if (candidateScore > currentScore) {
            current = candidate;
            currentScore = candidateScore;
            improved = true;
          }
        }
      }
    }
    return current;
  }, [calculateHappiness]);

  const generateInitialAssignment = useCallback((shuffleSeed = 0) => {
    const shuffledStudents = [...students];
    if (shuffleSeed > 0) {
      // Proper seeded Fisher-Yates shuffle
      const rng = seededRandom(shuffleSeed);
      for (let i = shuffledStudents.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
      }
    }

    const assignment = houses.map(h => ({ ...h, students: [] }));
    const assignedStudents = new Set();
    const mutualPairs = findMutualFirstPreferences();

    // Place mutual first-choice pairs, preferring their house preferences
    for (const [studentAId, studentBId] of mutualPairs) {
      if (assignedStudents.has(studentAId) || assignedStudents.has(studentBId)) continue;
      const studentA = students.find(s => s.id === studentAId);
      const studentB = students.find(s => s.id === studentBId);

      let bestHouse = null;
      let bestHouseScore = -1;
      for (const house of assignment) {
        if (house.students.length + 2 <= house.capacity) {
          let houseScore = 0;
          const aPrefs = studentA?.housePreferences || [];
          const bPrefs = studentB?.housePreferences || [];
          if (aPrefs[0] === house.id) houseScore += 2;
          else if (aPrefs[1] === house.id) houseScore += 1;
          if (bPrefs[0] === house.id) houseScore += 2;
          else if (bPrefs[1] === house.id) houseScore += 1;

          if (houseScore > bestHouseScore || (houseScore === bestHouseScore && !bestHouse)) {
            bestHouseScore = houseScore;
            bestHouse = house;
          }
        }
      }

      if (bestHouse) {
        bestHouse.students.push(studentAId, studentBId);
        assignedStudents.add(studentAId);
        assignedStudents.add(studentBId);
      }
    }

    // Place remaining students considering roommate AND house preferences
    for (const student of shuffledStudents) {
      if (assignedStudents.has(student.id)) continue;
      let bestHouse = null, bestScore = -Infinity;
      const housePrefs = student.housePreferences || [];

      for (const house of assignment) {
        if (house.students.length >= house.capacity) continue;
        const hasConflict = house.students.some(sid => {
          const s = students.find(st => st.id === sid);
          return student.avoids.includes(sid) || s?.avoids.includes(student.id);
        });
        if (hasConflict) continue;

        let score = 0;
        for (const existingStudentId of house.students) {
          const prefIdx = student.preferences.indexOf(existingStudentId);
          if (prefIdx !== -1) score += 10 - prefIdx;
        }
        if (housePrefs[0] === house.id) score += 15;
        else if (housePrefs[1] === house.id) score += 8;

        if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
          bestScore = score;
          bestHouse = house;
        }
      }
      if (!bestHouse) bestHouse = assignment.find(h => h.students.length < h.capacity);
      if (bestHouse) {
        bestHouse.students.push(student.id);
        assignedStudents.add(student.id);
      }
    }
    return assignment;
  }, [students, houses, findMutualFirstPreferences]);

  // Check if two solutions are >90% similar (same student-to-house mapping)
  const areSolutionsSimilar = (a, b) => {
    const mapA = {}, mapB = {};
    a.forEach(h => h.students.forEach(s => mapA[s] = h.id));
    b.forEach(h => h.students.forEach(s => mapB[s] = h.id));

    let sameCount = 0, total = 0;
    for (const sId in mapA) {
      total++;
      if (mapA[sId] === mapB[sId]) sameCount++;
    }
    return total > 0 && (sameCount / total) > 0.9;
  };

  const runAssignment = useCallback(() => {
    if (students.length === 0 || houses.length === 0) return;

    const totalCapacity = houses.reduce((sum, h) => sum + h.capacity, 0);
    if (students.length > totalCapacity) {
      alert(`Not enough capacity! Total capacity: ${totalCapacity}, Students: ${students.length}`);
      return;
    }

    setIsGenerating(true);
    setSolutions([]);
    setSelectedSolutionIndex(0);

    const studentCount = students.length;
    const scaleFactor = studentCount > CONFIG.ALGORITHM.SCALE_THRESHOLD
      ? Math.min(Math.pow(studentCount / CONFIG.ALGORITHM.SCALE_THRESHOLD, 1.5), 5)
      : 1;
    const numRuns = Math.min(Math.ceil(CONFIG.ALGORITHM.OPTIMIZATION_RUNS * scaleFactor), CONFIG.ALGORITHM.MAX_RUNS);
    const iterations = Math.min(Math.ceil(CONFIG.ALGORITHM.ANNEALING_ITERATIONS * scaleFactor), CONFIG.ALGORITHM.MAX_ITERATIONS);

    setProgress({ current: 0, total: numRuns });

    // Process runs in batches to allow progress updates
    const BATCH_SIZE = 3;
    const allResults = [];

    const processBatch = (startRun) => {
      const endRun = Math.min(startRun + BATCH_SIZE, numRuns);
      for (let run = startRun; run < endRun; run++) {
        const initial = generateInitialAssignment(run + 1);
        let optimized = optimizeAssignment(initial, iterations);
        optimized = greedyPolish(optimized);
        const runStats = calculateHappiness(optimized);
        const individualResults = analyzeStudentResults(optimized);
        allResults.push({ assignments: optimized, stats: runStats, individualResults });
      }

      setProgress({ current: endRun, total: numRuns });

      if (endRun < numRuns) {
        setTimeout(() => processBatch(endRun), 0);
      } else {
        // All runs complete - select top distinct solutions
        allResults.sort((a, b) => b.stats.score - a.stats.score);

        const solutionsToKeep = CONFIG.ALGORITHM.SOLUTIONS_TO_GENERATE;
        const kept = [];
        for (const result of allResults) {
          if (kept.length >= solutionsToKeep) break;
          const isDuplicate = kept.some(k => areSolutionsSimilar(k.assignments, result.assignments));
          if (!isDuplicate) {
            kept.push({
              id: kept.length,
              label: `Solution ${kept.length + 1}`,
              assignments: result.assignments,
              stats: {
                totalScore: result.stats.score,
                conflicts: result.stats.conflicts,
                mutualFirstMatches: result.stats.mutualFirstMatches,
                mutualPreferences: result.stats.mutualPreferences,
                preferencesMet: result.stats.preferencesMet,
                avgScore: result.stats.avgScore,
                houseFirstChoices: result.stats.houseFirstChoices,
                houseSecondChoices: result.stats.houseSecondChoices,
                validArrangements: numRuns,
                iterationsPerRun: iterations,
                individualResults: result.individualResults
              }
            });
          }
        }

        setSolutions(kept);
        setSelectedSolutionIndex(0);
        setIsGenerating(false);
      }
    };

    setTimeout(() => processBatch(0), 50);
  }, [students, houses, generateInitialAssignment, optimizeAssignment, calculateHappiness, analyzeStudentResults, greedyPolish]);

  const resetAssignments = useCallback(() => {
    setSolutions([]);
    setSelectedSolutionIndex(0);
  }, []);

  // Allow updating a solution's assignments (for manual tweaking)
  const updateSolution = useCallback((solutionIndex, newAssignments) => {
    setSolutions(prev => prev.map((sol, idx) => {
      if (idx !== solutionIndex) return sol;
      const newStats = calculateHappiness(newAssignments);
      const newResults = analyzeStudentResults(newAssignments);
      return {
        ...sol,
        assignments: newAssignments,
        stats: {
          ...sol.stats,
          totalScore: newStats.score,
          conflicts: newStats.conflicts,
          mutualFirstMatches: newStats.mutualFirstMatches,
          mutualPreferences: newStats.mutualPreferences,
          preferencesMet: newStats.preferencesMet,
          avgScore: newStats.avgScore,
          houseFirstChoices: newStats.houseFirstChoices,
          houseSecondChoices: newStats.houseSecondChoices,
          individualResults: newResults
        }
      };
    }));
  }, [calculateHappiness, analyzeStudentResults]);

  return {
    solutions,
    selectedSolutionIndex,
    setSelectedSolutionIndex,
    assignments,
    stats,
    isGenerating,
    progress,
    runAssignment,
    resetAssignments,
    calculateHappiness,
    analyzeStudentResults,
    updateSolution
  };
}
