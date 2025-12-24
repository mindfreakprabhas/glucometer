
export enum RoutineLabel {
  FASTING = 'Fasting',
  PRE_BREAKFAST = 'Pre-Breakfast',
  POST_BREAKFAST = 'Post-Breakfast',
  PRE_LUNCH = 'Pre-Lunch',
  POST_LUNCH = 'Post-Lunch',
  PRE_DINNER = 'Pre-Dinner',
  POST_DINNER = 'Post-Dinner',
  BEFORE_BED = 'Before Bed'
}

export interface Reminder {
  id: string;
  label: RoutineLabel;
  time: string; // HH:mm
  enabled: boolean;
  snoozedUntil?: number; // timestamp
}

export interface GlucoseLog {
  id: string;
  timestamp: number;
  value: number; // mg/dL
  label: RoutineLabel;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'tactical' | 'strategic' | 'info';
  timestamp: number;
  reminderId?: string;
}

export interface WeeklySummary {
  timeInRange: number; // percentage
  average: number;
  totalLogs: number;
  missingLogs: number;
}
