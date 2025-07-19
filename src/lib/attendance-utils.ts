export interface AttendanceCalculation {
  totalHours: number
  regularHours: number
  overtimeHours: number
  breakDuration: number
}

export interface WorkSchedule {
  startTime: string // "09:00"
  endTime: string   // "17:00"
  breakDuration: number // minutes
  regularHoursPerDay: number
  overtimeMultiplier: number
}

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  startTime: "09:00",
  endTime: "17:00", 
  breakDuration: 60, // 1 hour lunch break
  regularHoursPerDay: 8,
  overtimeMultiplier: 1.5
}

/**
 * Calculate attendance hours based on clock in/out times
 */
export function calculateAttendanceHours(
  clockIn: Date,
  clockOut: Date,
  breakStart?: Date,
  breakEnd?: Date,
  schedule: WorkSchedule = DEFAULT_WORK_SCHEDULE
): AttendanceCalculation {
  // Calculate total working time in minutes
  let totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60)
  
  // Subtract break time if both break times are provided
  let breakDuration = 0
  if (breakStart && breakEnd) {
    breakDuration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
    totalMinutes -= breakDuration
  }
  
  const totalHours = totalMinutes / 60
  
  // Calculate regular and overtime hours
  let regularHours = Math.min(totalHours, schedule.regularHoursPerDay)
  let overtimeHours = Math.max(0, totalHours - schedule.regularHoursPerDay)
  
  // Ensure we don't have negative regular hours
  regularHours = Math.max(0, regularHours)
  
  return {
    totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    breakDuration: Math.round(breakDuration)
  }
}

/**
 * Check if an employee is late based on scheduled start time
 */
export function isLateArrival(
  clockIn: Date,
  scheduleStartTime: string = DEFAULT_WORK_SCHEDULE.startTime,
  gracePeriodMinutes: number = 15
): boolean {
  const scheduledStart = parseTimeString(scheduleStartTime)
  const clockInTime = {
    hours: clockIn.getHours(),
    minutes: clockIn.getMinutes()
  }
  
  // Convert to minutes for easier comparison
  const scheduledMinutes = scheduledStart.hours * 60 + scheduledStart.minutes + gracePeriodMinutes
  const actualMinutes = clockInTime.hours * 60 + clockInTime.minutes
  
  return actualMinutes > scheduledMinutes
}

/**
 * Check if an employee left early
 */
export function isEarlyDeparture(
  clockOut: Date,
  scheduleEndTime: string = DEFAULT_WORK_SCHEDULE.endTime,
  gracePeriodMinutes: number = 15
): boolean {
  const scheduledEnd = parseTimeString(scheduleEndTime)
  const clockOutTime = {
    hours: clockOut.getHours(),
    minutes: clockOut.getMinutes()
  }
  
  // Convert to minutes for easier comparison
  const scheduledMinutes = scheduledEnd.hours * 60 + scheduledEnd.minutes - gracePeriodMinutes
  const actualMinutes = clockOutTime.hours * 60 + clockOutTime.minutes
  
  return actualMinutes < scheduledMinutes
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
function parseTimeString(timeString: string): { hours: number, minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number)
  return { hours, minutes }
}

/**
 * Calculate attendance status based on clock times and schedule
 */
export function determineAttendanceStatus(
  clockIn?: Date,
  clockOut?: Date,
  date: Date = new Date(),
  schedule: WorkSchedule = DEFAULT_WORK_SCHEDULE
): string {
  // Check if it's a weekend
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
    return 'WEEKEND'
  }
  
  // No clock in means absent
  if (!clockIn) {
    return 'ABSENT'
  }
  
  // Check if late
  if (isLateArrival(clockIn, schedule.startTime)) {
    return 'LATE'
  }
  
  // Check if half day (less than 4 hours worked)
  if (clockOut) {
    const { totalHours } = calculateAttendanceHours(clockIn, clockOut, undefined, undefined, schedule)
    if (totalHours < 4) {
      return 'HALF_DAY'
    }
  }
  
  return 'PRESENT'
}

/**
 * Format duration in hours to readable string
 */
export function formatDuration(hours: number): string {
  if (hours === 0) return '0h 0m'
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (wholeHours === 0) {
    return `${minutes}m`
  }
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}m`
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { start: Date, end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
      
    case 'week':
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Sunday
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
      
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(start.getMonth() + 1, 0) // Last day of month
      end.setHours(23, 59, 59, 999)
      break
      
    case 'year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
  }
  
  return { start, end }
}

/**
 * Check if date is a holiday (basic implementation)
 */
export function isHoliday(date: Date, holidays: Date[] = []): boolean {
  return holidays.some(holiday => 
    holiday.getDate() === date.getDate() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getFullYear() === date.getFullYear()
  )
}

/**
 * Generate attendance summary for a period
 */
export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  attendanceRate: number
}

export function calculateAttendanceSummary(attendanceRecords: any[]): AttendanceSummary {
  const totalDays = attendanceRecords.length
  const presentDays = attendanceRecords.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
  const absentDays = attendanceRecords.filter(r => r.status === 'ABSENT').length
  const lateDays = attendanceRecords.filter(r => r.status === 'LATE').length
  const halfDays = attendanceRecords.filter(r => r.status === 'HALF_DAY').length
  
  const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0)
  const regularHours = attendanceRecords.reduce((sum, r) => sum + (r.regularHours || 0), 0)
  const overtimeHours = attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0)
  
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
  
  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    halfDays,
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  }
}