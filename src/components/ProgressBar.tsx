import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../theme/spacing';

interface ProgressBarProps {
  steps: string[];
  currentStep: number; // 1-based index of the active step (0 = not started)
  theme: any;
}

const ProgressBar = ({ steps, currentStep, theme }: ProgressBarProps) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pct = currentStep > 0 ? (currentStep / steps.length) * 100 : 0;
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Step labels */}
      <View style={styles.stepsRow}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;
          return (
            <View key={i} style={styles.step}>
              <View style={[
                styles.dot,
                { borderColor: theme.border, backgroundColor: theme.surfaceSecondary },
                done && { backgroundColor: theme.success, borderColor: theme.success },
                active && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}>
                {done
                  ? <MaterialCommunityIcons name="check" size={12} color="white" />
                  : <Text style={[styles.dotText, (active || done) && { color: 'white' }]}>{stepNum}</Text>
                }
              </View>
              <Text style={[
                styles.label,
                { color: theme.textSecondary },
                active && { color: theme.primary, fontWeight: '600' },
                done && { color: theme.success },
              ]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Animated progress track */}
      <View style={[styles.track, { backgroundColor: theme.surfaceSecondary }]}>
        <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ProgressBar;
