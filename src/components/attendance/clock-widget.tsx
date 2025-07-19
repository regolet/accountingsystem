'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, MapPin } from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
}

interface TodayAttendance {
  id?: string
  clockIn?: string | null
  clockOut?: string | null
  breakStart?: string | null
  breakEnd?: string | null
  status?: string
  totalHours?: number | string | null
}

interface ClockWidgetProps {
  employees?: Employee[]
  selectedEmployeeId?: string
  onEmployeeSelect?: (employeeId: string) => void
  onClockAction?: () => void
  compact?: boolean
}

export default function ClockWidget({ 
  employees = [], 
  selectedEmployeeId, 
  onEmployeeSelect,
  onClockAction,
  compact = false 
}: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState(selectedEmployeeId || '')
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Get location for GPS tracking
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  // Fetch today's attendance when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchTodayAttendance()
    }
  }, [selectedEmployee])

  const fetchTodayAttendance = async () => {
    if (!selectedEmployee) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/attendance?employeeId=${selectedEmployee}&startDate=${today}&endDate=${today}`)
      const data = await response.json()
      
      if (response.ok && data.attendances?.length > 0) {
        setTodayAttendance(data.attendances[0])
      } else {
        setTodayAttendance(null)
      }
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error)
    }
  }

  const handleClockAction = async (action: 'clock_in' | 'clock_out' | 'break_start' | 'break_end') => {
    if (!selectedEmployee) {
      alert('Please select an employee first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          action,
          location
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchTodayAttendance()
        if (onClockAction) {
          onClockAction()
        }
        alert(data.message)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error processing clock action:', error)
      alert('Failed to process clock action. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    if (onEmployeeSelect) {
      onEmployeeSelect(employeeId)
    }
  }

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (hours: number | string | null | undefined) => {
    if (!hours) return '--:--'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '--:--'
    const totalMinutes = Math.round(numHours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const getActionButtons = () => {
    const buttons = []

    if (!todayAttendance?.clockIn) {
      buttons.push(
        <Button 
          key="clock-in"
          onClick={() => handleClockAction('clock_in')} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Clock className="h-4 w-4 mr-2" />
          Clock In
        </Button>
      )
    } else if (!todayAttendance?.clockOut) {
      if (!todayAttendance?.breakStart) {
        buttons.push(
          <Button 
            key="break-start"
            variant="secondary" 
            onClick={() => handleClockAction('break_start')} 
            disabled={loading}
          >
            Break Start
          </Button>
        )
      } else if (!todayAttendance?.breakEnd) {
        buttons.push(
          <Button 
            key="break-end"
            variant="secondary" 
            onClick={() => handleClockAction('break_end')} 
            disabled={loading}
          >
            Break End
          </Button>
        )
      }

      buttons.push(
        <Button 
          key="clock-out"
          onClick={() => handleClockAction('clock_out')} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          <Clock className="h-4 w-4 mr-2" />
          Clock Out
        </Button>
      )
    }

    return buttons
  }

  if (compact) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Clock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {employees.length > 0 && (
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          )}

          {selectedEmployee && (
            <div className="space-y-3">
              {todayAttendance && (
                <div className="text-xs bg-gray-50 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <span>Clock In:</span>
                    <span className="font-mono">{formatTime(todayAttendance.clockIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clock Out:</span>
                    <span className="font-mono">{formatTime(todayAttendance.clockOut)}</span>
                  </div>
                  {todayAttendance.totalHours && (
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span className="font-mono">{formatDuration(todayAttendance.totalHours)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {getActionButtons()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Employee Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Time Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold mb-2">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })}
          </div>
          <div className="text-lg text-gray-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Employee Selection */}
        {employees.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Select Employee</label>
            <select
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
            >
              <option value="">Choose an employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.department}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Today's Attendance Summary */}
        {selectedEmployee && todayAttendance && (
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Clock In</div>
                  <div className="text-lg font-mono font-semibold">
                    {formatTime(todayAttendance.clockIn)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Clock Out</div>
                  <div className="text-lg font-mono font-semibold">
                    {formatTime(todayAttendance.clockOut)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Break Time</div>
                  <div className="text-lg font-mono font-semibold">
                    {todayAttendance.breakStart && todayAttendance.breakEnd ? 
                      `${formatTime(todayAttendance.breakStart)} - ${formatTime(todayAttendance.breakEnd)}` : 
                      '--:--'
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Total Hours</div>
                  <div className="text-lg font-mono font-semibold">
                    {formatDuration(todayAttendance.totalHours)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Info */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            Location tracking enabled
          </div>
        )}

        {/* Action Buttons */}
        {selectedEmployee && (
          <div className="flex flex-wrap gap-3 justify-center">
            {getActionButtons()}
          </div>
        )}

        {!selectedEmployee && employees.length > 0 && (
          <div className="text-center text-gray-500">
            Please select an employee to begin time tracking
          </div>
        )}
      </CardContent>
    </Card>
  )
}