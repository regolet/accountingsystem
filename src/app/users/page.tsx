'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Edit, Trash2, Plus, Shield, Mail, User, Settings, Check, X } from 'lucide-react'
import { PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions'

interface UserData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER' as 'ADMIN' | 'ACCOUNTANT' | 'VIEWER',
  })
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserData | null>(null)
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Check if user is admin
    if (session && session.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else if (session) {
      fetchUsers()
    }
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setShowAddForm(false)
        setFormData({ name: '', email: '', password: '', role: 'VIEWER' })
        fetchUsers()
        alert('User created successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password && { password: formData.password })
        }),
      })
      
      if (response.ok) {
        setShowEditForm(false)
        setEditingUser(null)
        setFormData({ name: '', email: '', password: '', role: 'VIEWER' })
        fetchUsers()
        alert('User updated successfully!')
      } else {
        alert('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    })
    setShowEditForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchUsers()
        alert('User deleted successfully!')
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      ACCOUNTANT: 'bg-blue-100 text-blue-800',
      VIEWER: 'bg-gray-100 text-gray-800',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [permissionKey]: checked
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUserForPermissions) return

    try {
      const response = await fetch(`/api/users/${selectedUserForPermissions.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermissions }),
      })

      if (response.ok) {
        setShowPermissionsModal(false)
        setSelectedUserForPermissions(null)
        setUserPermissions({})
        alert('Permissions updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      alert('Failed to update permissions')
    }
  }

  const openPermissionsModal = async (user: UserData) => {
    setSelectedUserForPermissions(user)
    
    // Fetch current user permissions
    try {
      const response = await fetch(`/api/users/${user.id}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || {})
      } else {
        // If no custom permissions, use role defaults
        const defaultPermissions: Record<string, boolean> = {}
        DEFAULT_ROLE_PERMISSIONS[user.role].forEach(permission => {
          defaultPermissions[permission] = true
        })
        setUserPermissions(defaultPermissions)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      // Use role defaults as fallback
      const defaultPermissions: Record<string, boolean> = {}
      DEFAULT_ROLE_PERMISSIONS[user.role].forEach(permission => {
        defaultPermissions[permission] = true
      })
      setUserPermissions(defaultPermissions)
    }
    
    setShowPermissionsModal(true)
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
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="h-8 w-8 mr-3" />
          User Management
        </h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'ACCOUNTANT' | 'VIEWER' })}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create User</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit User Form */}
      {showEditForm && editingUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password or leave blank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'ACCOUNTANT' | 'VIEWER' })}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Update User</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setShowEditForm(false)
                  setEditingUser(null)
                  setFormData({ name: '', email: '', password: '', role: 'VIEWER' })
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No users found.</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openPermissionsModal(user)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {user.id !== session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUserForPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Permissions for {selectedUserForPermissions.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPermissionsModal(false)
                  setSelectedUserForPermissions(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.name} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{group.name}</h3>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <div key={permission.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              className="mr-3"
                              checked={userPermissions[permission.key] || false}
                              onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                            />
                            <label htmlFor={permission.key} className="font-medium">
                              {permission.label}
                            </label>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{permission.description}</p>
                        </div>
                        {userPermissions[permission.key] ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Current Role:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUserForPermissions.role)}`}>
                  {selectedUserForPermissions.role}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => {
                  setShowPermissionsModal(false)
                  setSelectedUserForPermissions(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSavePermissions}>
                  Save Permissions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold flex items-center">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 mr-2">
                  ADMIN
                </span>
                Administrator
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Full access to all features including user management, all CRUD operations, and system settings.
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">
                  ACCOUNTANT
                </span>
                Accountant
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Can create and manage invoices, customers, transactions, and view reports. Cannot manage users.
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mr-2">
                  VIEWER
                </span>
                Viewer
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Read-only access. Can view all data but cannot create, edit, or delete any records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}