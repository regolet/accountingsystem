'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import ClockWidget from '@/components/attendance/clock-widget'
import { Plus, Search, Clock, Calendar, Filter, Download, Eye, Edit, Trash2, Clock3, Clock4 } from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
}

interface Attendance {
  id: string
  employeeId: string
  employee: Employee
  date: string
  clockIn: string | null
  clockOut: string | null
  breakStart: string | null
  breakEnd: string | null
  totalHours: number | string | null
  regularHours: number | string | null
  overtimeHours: number | string | null
  status: string
  notes: string | null
  isManual: boolean
  createdAt: string
  updatedAt: string
}

const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-800' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-800' },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-blue-100 text-blue-800' },
  { value: 'SICK_LEAVE', label: 'Sick Leave', color: 'bg-purple-100 text-purple-800' },
  { value: 'VACATION_LEAVE', label: 'Vacation Leave', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'PERSONAL_LEAVE', label: 'Personal Leave', color: 'bg-pink-100 text-pink-800' },
  { value: 'EMERGENCY_LEAVE', label: 'Emergency Leave', color: 'bg-orange-100 text-orange-800' },
  { value: 'UNPAID_LEAVE', label: 'Unpaid Leave', color: 'bg-gray-100 text-gray-800' },
  { value: 'HOLIDAY', label: 'Holiday', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'WEEKEND', label: 'Weekend', color: 'bg-slate-100 text-slate-800' },
]

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showClockModal, setShowClockModal] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    breakStart: '',
    breakEnd: '',
    status: 'PRESENT',
    notes: '',
  })

  useEffect(() => {
    fetchAttendances()
    fetchEmployees()
  }, [selectedEmployee, selectedStatus, startDate, endDate, currentPage])

  const fetchAttendances = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedEmployee) params.append('employeeId', selectedEmployee)
      if (selectedStatus) params.append('status', selectedStatus)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('page', currentPage.toString())
      
      const response = await fetch(`/api/attendance?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setAttendances(data.attendances || [])
        setTotalPages(data.pagination?.pages || 1)
      } else {
        console.error('Error fetching attendances:', data.error)
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        clockIn: formData.clockIn ? new Date(`${formData.date}T${formData.clockIn}`).toISOString() : null,
        clockOut: formData.clockOut ? new Date(`${formData.date}T${formData.clockOut}`).toISOString() : null,
        breakStart: formData.breakStart ? new Date(`${formData.date}T${formData.breakStart}`).toISOString() : null,
        breakEnd: formData.breakEnd ? new Date(`${formData.date}T${formData.breakEnd}`).toISOString() : null,
        isManual: true,
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowAddForm(false)
        resetForm()
        fetchAttendances()
        alert('Attendance record added successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating attendance:', error)
      alert('Failed to create attendance record. Please try again.')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAttendance) return

    try {
      const submitData = {
        clockIn: formData.clockIn ? new Date(`${formData.date}T${formData.clockIn}`).toISOString() : null,
        clockOut: formData.clockOut ? new Date(`${formData.date}T${formData.clockOut}`).toISOString() : null,
        breakStart: formData.breakStart ? new Date(`${formData.date}T${formData.breakStart}`).toISOString() : null,
        breakEnd: formData.breakEnd ? new Date(`${formData.date}T${formData.breakEnd}`).toISOString() : null,
        status: formData.status,
        notes: formData.notes,
      }

      const response = await fetch(`/api/attendance/${editingAttendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowEditForm(false)
        setEditingAttendance(null)
        resetForm()
        fetchAttendances()
        alert('Attendance record updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Failed to update attendance record. Please try again.')
    }
  }

  const handleDelete = async (id: string, employeeName: string) => {
    const confirmMessage = `Are you sure you want to delete the attendance record for ${employeeName}? This action cannot be undone.`
    if (!confirm(confirmMessage)) return
    
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchAttendances()
        alert('Attendance record deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting attendance:', error)
      alert('Failed to delete attendance record. Please try again.')
    }
  }

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance)
    setFormData({
      employeeId: attendance.employeeId,
      date: attendance.date.split('T')[0],
      clockIn: attendance.clockIn ? new Date(attendance.clockIn).toTimeString().slice(0, 5) : '',
      clockOut: attendance.clockOut ? new Date(attendance.clockOut).toTimeString().slice(0, 5) : '',
      breakStart: attendance.breakStart ? new Date(attendance.breakStart).toTimeString().slice(0, 5) : '',
      breakEnd: attendance.breakEnd ? new Date(attendance.breakEnd).toTimeString().slice(0, 5) : '',
      status: attendance.status,
      notes: attendance.notes || '',
    })
    setShowEditForm(true)
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      clockIn: '',
      clockOut: '',
      breakStart: '',
      breakEnd: '',
      status: 'PRESENT',
      notes: '',
    })
  }

  const getStatusColor = (status: string) => {
    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === status)
    return statusConfig?.color || 'bg-gray-100 text-gray-800'
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatHours = (hours: number | string | null) => {
    if (!hours) return '-'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '-'
    return `${numHours.toFixed(2)}h`
  }

  const resetFilters = () => {
    setSelectedEmployee('')
    setSelectedStatus('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <div className="flex gap-2">
          <RoleGuard permission="clockInOut">
            <Button variant="outline" onClick={() => setShowClockModal(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Clock In/Out
            </Button>
          </RoleGuard>
          <RoleGuard permission="createAttendance">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {ATTENDANCE_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.employee.firstName} {attendance.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attendance.employee.employeeId} • {attendance.employee.department}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance.clockIn)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance.clockOut)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {attendance.breakStart && attendance.breakEnd 
                          ? `${formatTime(attendance.breakStart)} - ${formatTime(attendance.breakEnd)}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{formatHours(attendance.totalHours)}</div>
                          {attendance.overtimeHours && attendance.overtimeHours > 0 && (
                            <div className="text-xs text-orange-600">
                              OT: {formatHours(attendance.overtimeHours)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attendance.status)}`}>
                          {ATTENDANCE_STATUSES.find(s => s.value === attendance.status)?.label || attendance.status}
                        </span>
                        {attendance.isManual && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-1">
                          <RoleGuard permission="editAttendance">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(attendance)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </RoleGuard>
                          <RoleGuard permission="deleteAttendance">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(
                                attendance.id, 
                                `${attendance.employee.firstName} ${attendance.employee.lastName}`
                              )}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Attendance Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add Attendance Record</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Clock In</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.clockIn}
                      onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Clock Out</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.clockOut}
                      onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Break Start</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.breakStart}
                      onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Break End</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.breakEnd}
                      onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {ATTENDANCE_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">Add Record</Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Form Modal */}
      {showEditForm && editingAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Attendance Record</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                      value={`${editingAttendance.employee.firstName} ${editingAttendance.employee.lastName} (${editingAttendance.employee.employeeId})`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                      value={formData.date}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Clock In</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.clockIn}
                      onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Clock Out</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.clockOut}
                      onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Break Start</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.breakStart}
                      onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Break End</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.breakEnd}
                      onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {ATTENDANCE_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">Update Record</Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setShowEditForm(false)
                    setEditingAttendance(null)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Clock In/Out Modal */}
      {showClockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Employee Clock</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowClockModal(false)}>
                  ×
                </Button>
              </div>
              <ClockWidget 
                employees={employees} 
                compact={false}
                onClockAction={() => {
                  fetchAttendances()
                  setShowClockModal(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}