type Role = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'

export const permissions = {
  // Dashboard access
  viewDashboard: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  
  // Customer management
  viewCustomers: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createCustomers: ['ADMIN', 'ACCOUNTANT'],
  editCustomers: ['ADMIN', 'ACCOUNTANT'],
  deleteCustomers: ['ADMIN'],
  
  // Invoice management
  viewInvoices: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createInvoices: ['ADMIN', 'ACCOUNTANT'],
  editInvoices: ['ADMIN', 'ACCOUNTANT'],
  deleteInvoices: ['ADMIN'],
  sendInvoices: ['ADMIN', 'ACCOUNTANT'],
  
  // Reports
  viewReports: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  exportReports: ['ADMIN', 'ACCOUNTANT'],
  
  // Subscriptions
  viewSubscriptions: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createSubscriptions: ['ADMIN', 'ACCOUNTANT'],
  editSubscriptions: ['ADMIN', 'ACCOUNTANT'],
  deleteSubscriptions: ['ADMIN'],
  
  // Settings
  viewSettings: ['ADMIN', 'ACCOUNTANT'],
  editSettings: ['ADMIN'],
  
  // User management
  viewUsers: ['ADMIN'],
  createUsers: ['ADMIN'],
  editUsers: ['ADMIN'],
  deleteUsers: ['ADMIN'],
  
  // Payments
  viewPayments: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createPayments: ['ADMIN', 'ACCOUNTANT'],
  editPayments: ['ADMIN', 'ACCOUNTANT'],
  deletePayments: ['ADMIN'],
} as const

export interface PermissionGroup {
  name: string
  permissions: {
    key: keyof typeof permissions
    label: string
    description: string
  }[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Dashboard',
    permissions: [
      {
        key: 'viewDashboard',
        label: 'View Dashboard',
        description: 'Access to dashboard and analytics'
      }
    ]
  },
  {
    name: 'Customers',
    permissions: [
      {
        key: 'viewCustomers',
        label: 'View Customers',
        description: 'View customer list and details'
      },
      {
        key: 'createCustomers',
        label: 'Create Customers',
        description: 'Add new customers'
      },
      {
        key: 'editCustomers',
        label: 'Edit Customers',
        description: 'Modify customer information'
      },
      {
        key: 'deleteCustomers',
        label: 'Delete Customers',
        description: 'Remove customers from system'
      }
    ]
  },
  {
    name: 'Invoices',
    permissions: [
      {
        key: 'viewInvoices',
        label: 'View Invoices',
        description: 'View invoice list and details'
      },
      {
        key: 'createInvoices',
        label: 'Create Invoices',
        description: 'Create new invoices'
      },
      {
        key: 'editInvoices',
        label: 'Edit Invoices',
        description: 'Modify existing invoices'
      },
      {
        key: 'deleteInvoices',
        label: 'Delete Invoices',
        description: 'Remove invoices'
      },
      {
        key: 'sendInvoices',
        label: 'Send Invoices',
        description: 'Send invoices to customers'
      }
    ]
  },
  {
    name: 'Payments',
    permissions: [
      {
        key: 'viewPayments',
        label: 'View Payments',
        description: 'View payment history'
      },
      {
        key: 'createPayments',
        label: 'Process Payments',
        description: 'Record new payments'
      },
      {
        key: 'editPayments',
        label: 'Edit Payments',
        description: 'Modify payment records'
      },
      {
        key: 'deletePayments',
        label: 'Delete Payments',
        description: 'Remove payment records'
      }
    ]
  },
  {
    name: 'Reports',
    permissions: [
      {
        key: 'viewReports',
        label: 'View Reports',
        description: 'Access financial reports'
      },
      {
        key: 'exportReports',
        label: 'Export Reports',
        description: 'Export reports to PDF/Excel'
      }
    ]
  },
  {
    name: 'Settings',
    permissions: [
      {
        key: 'viewSettings',
        label: 'View Settings',
        description: 'Access settings page'
      },
      {
        key: 'editSettings',
        label: 'Edit Settings',
        description: 'Modify company and invoice settings'
      }
    ]
  },
  {
    name: 'User Management',
    permissions: [
      {
        key: 'viewUsers',
        label: 'View Users',
        description: 'View user list'
      },
      {
        key: 'createUsers',
        label: 'Create Users',
        description: 'Add new users'
      },
      {
        key: 'editUsers',
        label: 'Edit Users',
        description: 'Modify user details'
      },
      {
        key: 'deleteUsers',
        label: 'Delete Users',
        description: 'Remove users'
      }
    ]
  },
  {
    name: 'Subscriptions',
    permissions: [
      {
        key: 'viewSubscriptions',
        label: 'View Subscriptions',
        description: 'View subscription list'
      },
      {
        key: 'createSubscriptions',
        label: 'Create Subscriptions',
        description: 'Add new subscriptions'
      },
      {
        key: 'editSubscriptions',
        label: 'Edit Subscriptions',
        description: 'Modify subscriptions'
      },
      {
        key: 'deleteSubscriptions',
        label: 'Delete Subscriptions',
        description: 'Cancel subscriptions'
      }
    ]
  }
]

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, (keyof typeof permissions)[]> = {
  ADMIN: Object.keys(permissions) as (keyof typeof permissions)[], // All permissions
  ACCOUNTANT: [
    'viewDashboard',
    'viewCustomers',
    'createCustomers',
    'editCustomers',
    'viewInvoices',
    'createInvoices',
    'editInvoices',
    'sendInvoices',
    'viewPayments',
    'createPayments',
    'viewReports',
    'viewSettings',
    'viewSubscriptions',
    'createSubscriptions',
    'editSubscriptions',
  ],
  VIEWER: [
    'viewDashboard',
    'viewCustomers',
    'viewInvoices',
    'viewPayments',
    'viewReports',
    'viewSettings',
    'viewSubscriptions',
  ]
}

export function hasPermission(userRole: Role, permission: keyof typeof permissions): boolean {
  return permissions[permission].includes(userRole as any)
}

export function hasGranularPermission(
  userRole: Role,
  permission: keyof typeof permissions,
  customPermissions?: Record<string, boolean>
): boolean {
  // First check custom permissions if they exist
  if (customPermissions && customPermissions.hasOwnProperty(permission)) {
    return customPermissions[permission]
  }
  
  // Fall back to role-based permissions
  return hasPermission(userRole, permission)
}

export function requirePermission(userRole: Role, permission: keyof typeof permissions): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Access denied: ${permission} requires one of: ${permissions[permission].join(', ')}`)
  }
}

export function requireGranularPermission(
  userRole: Role,
  permission: keyof typeof permissions,
  customPermissions?: Record<string, boolean>
): void {
  if (!hasGranularPermission(userRole, permission, customPermissions)) {
    throw new Error(`Access denied: ${permission} permission required`)
  }
}