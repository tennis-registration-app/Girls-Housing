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
    OPTIMIZATION_RUNS: 10,           // Base number of random starting configurations
    ANNEALING_ITERATIONS: 3000,      // Base steps per simulated annealing run
    INITIAL_TEMPERATURE: 200,        // Starting temperature for annealing
    COOLING_RATE: 0.998,             // Temperature decay rate per iteration (slower cooling)
    // Scaling: increase iterations for larger groups
    SCALE_THRESHOLD: 15,             // Start scaling above this many students
    MAX_RUNS: 30,                    // Maximum optimization runs
    MAX_ITERATIONS: 15000,           // Maximum annealing iterations
    // Reheat to escape local optima
    REHEAT_INTERVAL: 500,            // Reheat every N iterations
    REHEAT_FACTOR: 0.3,              // Reheat to this fraction of best temperature
    // Operation probabilities during optimization
    SWAP_PROBABILITY: 0.4,           // Probability of 2-way swap
    CYCLE_PROBABILITY: 0.25,         // Probability of 3-way cycle swap
    MOVE_PROBABILITY: 0.15,          // Probability of single student move
    SMART_SWAP_PROBABILITY: 0.2,     // Probability of preference-aware swap
    // Multi-solution
    SOLUTIONS_TO_GENERATE: 5,        // Number of distinct solutions to keep
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
