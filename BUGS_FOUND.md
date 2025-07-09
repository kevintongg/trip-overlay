# Critical Bugs Found in GPS Processing

## 🐛 **Bug Report: GPS Processing Issues**

### 1. **GPS Drift Not Handled (CRITICAL)**

**Problem**: When streamer is stationary, GPS drift causes tiny movements that accumulate as distance
**Location**: `processLocationUpdate` function, lines 189-195
**Issue**: 25th percentile smoothing is too aggressive and hides real movement while allowing drift
**Impact**: False distance accumulation when stationary

### 2. **Walking Detection Too Sensitive (HIGH)**

**Problem**: 0.5 km/h threshold in `determineMovementMode` triggers on GPS noise
**Location**: Line 99 - `WALKING_THRESHOLD = 0.5`
**Issue**: Stationary person with GPS drift shows as "WALKING"
**Impact**: Incorrect mode detection, false distance accumulation

### 3. **Mode Switch Logic Broken (CRITICAL)**

**Problem**: `determineMovementMode` called with wrong parameters
**Location**: Line 198 - `determineMovementMode(smoothedSpeed, currentState.currentMode)`
**Issue**: Function expects 3 parameters but only gets 2
**Impact**: Mode switching doesn't work properly

### 4. **Distance Accumulation Logic Flawed (HIGH)**

**Problem**: Distance added without proper GPS drift detection
**Location**: Lines 218-232
**Issue**: No check for stationary drift, accumulates tiny movements
**Impact**: False distance when stationary

### 5. **State Update Bug (MEDIUM)**

**Problem**: References to undefined variables in setState
**Location**: Line 237 - `actualMode`, `newTotalTraveled`, `newTodayTraveled`
**Issue**: Variables not defined in scope
**Impact**: State updates fail

### 6. **Speed Smoothing Too Aggressive (MEDIUM)**

**Problem**: 25th percentile removes real movement signals
**Location**: Line 194
**Issue**: Hides actual walking speeds, makes detection insensitive
**Impact**: Slow walking not detected

### 7. **No Stationary Center Tracking (HIGH)**

**Problem**: No reference point for detecting GPS drift
**Location**: Missing throughout GPS processing
**Issue**: Can't distinguish between drift and real movement
**Impact**: Accumulates drift as distance

### 8. **Mode Consistency Not Enforced (MEDIUM)**

**Problem**: Mode can switch on single noisy reading
**Location**: Lines 201-206
**Issue**: No consistency requirement for mode changes
**Impact**: Rapid mode switching, unstable behavior

## 🔧 **Required Fixes:**

1. **Implement stationary center tracking**
2. **Add GPS drift detection with distance thresholds**
3. **Fix mode switching with consistency requirements**
4. **Improve speed smoothing algorithm**
5. **Add proper distance validation**
6. **Fix state variable references**
7. **Increase walking threshold to realistic value**
8. **Add comprehensive logging for debugging**

## 📊 **Impact Assessment:**

- **Distance Accuracy**: Currently unreliable due to drift accumulation
- **Mode Detection**: Frequently incorrect due to sensitive thresholds
- **User Experience**: Confusing behavior when stationary
- **Streaming Reliability**: Unpredictable distance updates on stream

## 🎯 **Priority Order:**

1. Fix GPS drift detection (stops false distance)
2. Fix mode switching logic (enables proper detection)
3. Improve movement thresholds (reduces false positives)
4. Add consistency requirements (stabilizes behavior)
5. Fix state update bugs (prevents crashes)
