import { useState, useCallback } from 'react';
import { CONFIG } from '../config';

export function useAssignmentAlgorithm(students, houses, getStudentName) {
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

        // Check house preferences
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

        // Check house preference result
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

  // 2-way swap: exchange two students between houses
  const swapStudents = (assignment, house1Idx, student1Idx, house2Idx, student2Idx) => {
    const newAssignment = cloneAssignment(assignment);
    const student1 = newAssignment[house1Idx].students[student1Idx];
    const student2 = newAssignment[house2Idx].students[student2Idx];
    newAssignment[house1Idx].students[student1Idx] = student2;
    newAssignment[house2Idx].students[student2Idx] = student1;
    return newAssignment;
  };

  // 3-way cycle swap: A→B, B→C, C→A (rotate students through 3 houses)
  const cycleSwapStudents = (assignment, h1Idx, s1Idx, h2Idx, s2Idx, h3Idx, s3Idx) => {
    const newAssignment = cloneAssignment(assignment);
    const student1 = newAssignment[h1Idx].students[s1Idx];
    const student2 = newAssignment[h2Idx].students[s2Idx];
    const student3 = newAssignment[h3Idx].students[s3Idx];
    // Rotate: 1→2's spot, 2→3's spot, 3→1's spot
    newAssignment[h2Idx].students[s2Idx] = student1;
    newAssignment[h3Idx].students[s3Idx] = student2;
    newAssignment[h1Idx].students[s1Idx] = student3;
    return newAssignment;
  };

  // Move single student to a different house (if capacity allows)
  const moveStudent = (assignment, fromHouseIdx, studentIdx, toHouseIdx) => {
    const newAssignment = cloneAssignment(assignment);
    const student = newAssignment[fromHouseIdx].students[studentIdx];
    newAssignment[fromHouseIdx].students.splice(studentIdx, 1);
    newAssignment[toHouseIdx].students.push(student);
    return newAssignment;
  };

  const optimizeAssignment = useCallback((initialAssignment, iterations) => {
    let currentAssignment = cloneAssignment(initialAssignment);
    let currentScore = calculateHappiness(currentAssignment).score;
    let bestAssignment = cloneAssignment(currentAssignment);
    let bestScore = currentScore;
    let temperature = CONFIG.ALGORITHM.INITIAL_TEMPERATURE;
    const coolingRate = CONFIG.ALGORITHM.COOLING_RATE;

    for (let i = 0; i < iterations; i++) {
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
        while (houseIndices.length < 3) {
          const idx = Math.floor(Math.random() * currentAssignment.length);
          if (!houseIndices.includes(idx) && currentAssignment[idx].students.length > 0) {
            houseIndices.push(idx);
          }
        }
        const [h1, h2, h3] = houseIndices;
        const s1 = Math.floor(Math.random() * currentAssignment[h1].students.length);
        const s2 = Math.floor(Math.random() * currentAssignment[h2].students.length);
        const s3 = Math.floor(Math.random() * currentAssignment[h3].students.length);
        newAssignment = cycleSwapStudents(currentAssignment, h1, s1, h2, s2, h3, s3);

      } else {
        // Single student move
        const fromHouseIdx = Math.floor(Math.random() * currentAssignment.length);
        if (currentAssignment[fromHouseIdx].students.length <= 1) continue; // Keep at least 1 student

        // Find houses with available capacity
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
        }
      }
      temperature *= coolingRate;
    }
    return bestAssignment;
  }, [calculateHappiness]);

  const generateInitialAssignment = useCallback((shuffleSeed = 0) => {
    const shuffledStudents = [...students];
    if (shuffleSeed > 0) {
      for (let i = shuffledStudents.length - 1; i > 0; i--) {
        const j = Math.floor(((i + 1) * shuffleSeed) % (i + 1));
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

      // Find best house considering both students' house preferences
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
        // Roommate preference score
        for (const existingStudentId of house.students) {
          const prefIdx = student.preferences.indexOf(existingStudentId);
          if (prefIdx !== -1) score += 10 - prefIdx;
        }
        // House preference score
        if (housePrefs[0] === house.id) score += 15;  // Strong bonus for 1st choice house
        else if (housePrefs[1] === house.id) score += 8;  // Moderate bonus for 2nd choice

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

  const runAssignment = useCallback(() => {
    if (students.length === 0 || houses.length === 0) return;

    const totalCapacity = houses.reduce((sum, h) => sum + h.capacity, 0);
    if (students.length > totalCapacity) {
      alert(`Not enough capacity! Total capacity: ${totalCapacity}, Students: ${students.length}`);
      return;
    }

    setIsGenerating(true);
    setStats(null);

    setTimeout(() => {
      const studentCount = students.length;
      const scaleFactor = studentCount > CONFIG.ALGORITHM.SCALE_THRESHOLD
        ? Math.min(studentCount / CONFIG.ALGORITHM.SCALE_THRESHOLD, 3) : 1;
      const numRuns = Math.min(Math.ceil(CONFIG.ALGORITHM.OPTIMIZATION_RUNS * scaleFactor), CONFIG.ALGORITHM.MAX_RUNS);
      const iterations = Math.min(Math.ceil(CONFIG.ALGORITHM.ANNEALING_ITERATIONS * scaleFactor), CONFIG.ALGORITHM.MAX_ITERATIONS);

      let bestAssignment = null, bestStats = null;
      for (let run = 0; run < numRuns; run++) {
        const initial = generateInitialAssignment(run + 1);
        const optimized = optimizeAssignment(initial, iterations);
        const runStats = calculateHappiness(optimized);
        if (!bestAssignment || runStats.score > bestStats.score) {
          bestAssignment = optimized;
          bestStats = runStats;
        }
      }

      setAssignments(bestAssignment);
      const individualResults = analyzeStudentResults(bestAssignment);
      setStats({
        totalScore: bestStats.score, conflicts: bestStats.conflicts,
        mutualFirstMatches: bestStats.mutualFirstMatches, mutualPreferences: bestStats.mutualPreferences,
        preferencesMet: bestStats.preferencesMet, avgScore: bestStats.avgScore,
        houseFirstChoices: bestStats.houseFirstChoices, houseSecondChoices: bestStats.houseSecondChoices,
        validArrangements: numRuns, iterationsPerRun: iterations, individualResults
      });
      setIsGenerating(false);
    }, 50);
  }, [students, houses, generateInitialAssignment, optimizeAssignment, calculateHappiness, analyzeStudentResults]);

  const resetAssignments = useCallback(() => {
    setAssignments([]);
    setStats(null);
  }, []);

  return {
    assignments,
    stats,
    isGenerating,
    runAssignment,
    resetAssignments
  };
}
