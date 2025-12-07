// ============================================
// CONFIGURATION CONSTANTS
// ============================================
export const CONFIG = {
  // Preference limits
  MAX_PREFERENCES: 10,
  MAX_AVOIDS: 2,

  // Scoring weights
  SCORING: {
    BASE_PREFERENCE_SCORE: 100,      // Base points for matched preference
    PREFERENCE_DECAY_RATE: 0.7,      // Exponential decay per rank (1st=100, 2nd=70, 3rd=49...)
    MUTUAL_FIRST_MULTIPLIER: 3,      // Bonus multiplier for mutual first choices
    MUTUAL_ANY_MULTIPLIER: 1.5,      // Bonus multiplier for any mutual preference
    AVOID_CONFLICT_PENALTY: 1000,    // Penalty for placing avoided students together
    HOUSE_FIRST_CHOICE_SCORE: 50,    // Points for getting first choice house
    HOUSE_SECOND_CHOICE_SCORE: 25,   // Points for getting second choice house
  },

  // Algorithm parameters
  ALGORITHM: {
    OPTIMIZATION_RUNS: 5,            // Base number of random starting configurations
    ANNEALING_ITERATIONS: 500,       // Base steps per simulated annealing run
    INITIAL_TEMPERATURE: 100,        // Starting temperature for annealing
    COOLING_RATE: 0.995,             // Temperature decay rate per iteration
    // Scaling: increase iterations for larger groups
    SCALE_THRESHOLD: 20,             // Start scaling above this many students
    MAX_RUNS: 15,                    // Maximum optimization runs
    MAX_ITERATIONS: 2000,            // Maximum annealing iterations
  },

  // UI defaults
  DEFAULTS: {
    HOUSE_CAPACITY: 6,
  },

  // LocalStorage keys
  STORAGE_KEYS: {
    HOUSES: 'wl-housing-houses',
    STUDENTS: 'wl-housing-students',
    PROJECTS: 'wl-housing-projects',
  }
};
