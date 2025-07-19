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
  
  // Expenses
  viewExpenses: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createExpenses: ['ADMIN', 'ACCOUNTANT'],
  editExpenses: ['ADMIN', 'ACCOUNTANT'],
  deleteExpenses: ['ADMIN'],
  
  // Reimbursements
  viewReimbursements: ['ADMIN', 'ACCOUNTANT', 'VIEWER'],
  createReimbursements: ['ADMIN', 'ACCOUNTANT'],
  editReimbursements: ['ADMIN', 'ACCOUNTANT'],
  deleteReimbursements: ['ADMIN'],
  sendReimbursements: ['ADMIN', 'ACCOUNTANT'],
  
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
  
  // HRMS - General
  viewHRMS: ['ADMIN', 'ACCOUNTANT'],
  createHRMS: ['ADMIN'],
  editHRMS: ['ADMIN'],
  deleteHRMS: ['ADMIN'],
  
  // HRMS - Employees
  viewEmployees: ['ADMIN', 'ACCOUNTANT'],
  createEmployees: ['ADMIN'],
  editEmployees: ['ADMIN'],
  deleteEmployees: ['ADMIN'],
  
  // HRMS - Attendance
  viewAttendance: ['ADMIN', 'ACCOUNTANT'],
  createAttendance: ['ADMIN', 'ACCOUNTANT'],
  editAttendance: ['ADMIN'],
  deleteAttendance: ['ADMIN'],
  clockInOut: ['ADMIN', 'ACCOUNTANT'], // For employee clock in/out
  viewAttendanceReports: ['ADMIN', 'ACCOUNTANT'],
  
  // HRMS - Payroll
  viewPayroll: ['ADMIN', 'ACCOUNTANT'],
  createPayroll: ['ADMIN'],
  editPayroll: ['ADMIN'],
  deletePayroll: ['ADMIN'],
  
  // HRMS - Earnings
  viewEarnings: ['ADMIN', 'ACCOUNTANT'],
  createEarnings: ['ADMIN'],
  editEarnings: ['ADMIN'],
  deleteEarnings: ['ADMIN'],
  
  // HRMS - Deductions
  viewDeductions: ['ADMIN', 'ACCOUNTANT'],
  createDeductions: ['ADMIN'],
  editDeductions: ['ADMIN'],
  deleteDeductions: ['ADMIN'],
  
  // HRMS - HR Reports
  viewHRReports: ['ADMIN', 'ACCOUNTANT'],
  exportHRReports: ['ADMIN', 'ACCOUNTANT'],
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
  },
  {
    name: 'Expenses',
    permissions: [
      {
        key: 'viewExpenses',
        label: 'View Expenses',
        description: 'View expense records and reports'
      },
      {
        key: 'createExpenses',
        label: 'Create Expenses',
        description: 'Add new expense entries'
      },
      {
        key: 'editExpenses',
        label: 'Edit Expenses',
        description: 'Modify existing expenses'
      },
      {
        key: 'deleteExpenses',
        label: 'Delete Expenses',
        description: 'Remove expense records'
      }
    ]
  },
  {
    name: 'Reimbursements',
    permissions: [
      {
        key: 'viewReimbursements',
        label: 'View Reimbursements',
        description: 'View reimbursement requests and billing'
      },
      {
        key: 'createReimbursements',
        label: 'Create Reimbursements',
        description: 'Create new reimbursement requests'
      },
      {
        key: 'editReimbursements',
        label: 'Edit Reimbursements',
        description: 'Modify existing reimbursements'
      },
      {
        key: 'deleteReimbursements',
        label: 'Delete Reimbursements',
        description: 'Remove reimbursement records'
      },
      {
        key: 'sendReimbursements',
        label: 'Send Reimbursements',
        description: 'Send reimbursement bills to customers'
      }
    ]
  },
  {
    name: 'HRMS - Employees',
    permissions: [
      {
        key: 'viewEmployees',
        label: 'View Employees',
        description: 'View employee list and details'
      },
      {
        key: 'createEmployees',
        label: 'Create Employees',
        description: 'Add new employees'
      },
      {
        key: 'editEmployees',
        label: 'Edit Employees',
        description: 'Modify employee information'
      },
      {
        key: 'deleteEmployees',
        label: 'Delete Employees',
        description: 'Remove employees from system'
      }
    ]
  },
  {
    name: 'HRMS - Attendance',
    permissions: [
      {
        key: 'viewAttendance',
        label: 'View Attendance',
        description: 'View attendance records'
      },
      {
        key: 'createAttendance',
        label: 'Record Attendance',
        description: 'Add attendance records'
      },
      {
        key: 'editAttendance',
        label: 'Edit Attendance',
        description: 'Modify attendance records'
      },
      {
        key: 'deleteAttendance',
        label: 'Delete Attendance',
        description: 'Remove attendance records'
      }
    ]
  },
  {
    name: 'HRMS - Payroll',
    permissions: [
      {
        key: 'viewPayroll',
        label: 'View Payroll',
        description: 'View payroll information'
      },
      {
        key: 'createPayroll',
        label: 'Create Payroll',
        description: 'Generate payroll'
      },
      {
        key: 'editPayroll',
        label: 'Edit Payroll',
        description: 'Modify payroll records'
      },
      {
        key: 'deletePayroll',
        label: 'Delete Payroll',
        description: 'Remove payroll records'
      }
    ]
  },
  {
    name: 'HRMS - Earnings',
    permissions: [
      {
        key: 'viewEarnings',
        label: 'View Earnings',
        description: 'View employee earnings and salary components'
      },
      {
        key: 'createEarnings',
        label: 'Create Earnings',
        description: 'Add new earning types and allowances'
      },
      {
        key: 'editEarnings',
        label: 'Edit Earnings',
        description: 'Modify earning structures and rates'
      },
      {
        key: 'deleteEarnings',
        label: 'Delete Earnings',
        description: 'Remove earning components'
      }
    ]
  },
  {
    name: 'HRMS - Deductions',
    permissions: [
      {
        key: 'viewDeductions',
        label: 'View Deductions',
        description: 'View salary deductions and rules'
      },
      {
        key: 'createDeductions',
        label: 'Create Deductions',
        description: 'Add new deduction types and rules'
      },
      {
        key: 'editDeductions',
        label: 'Edit Deductions',
        description: 'Modify deduction settings'
      },
      {
        key: 'deleteDeductions',
        label: 'Delete Deductions',
        description: 'Remove deduction rules'
      }
    ]
  },
  {
    name: 'HRMS - Reports',
    permissions: [
      {
        key: 'viewHRReports',
        label: 'View HR Reports',
        description: 'Access HR reports'
      },
      {
        key: 'exportHRReports',
        label: 'Export HR Reports',
        description: 'Export HR reports to PDF/Excel'
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
    'viewExpenses',
    'createExpenses',
    'editExpenses',
    'viewReimbursements',
    'createReimbursements',
    'editReimbursements',
    'sendReimbursements',
    'viewHRMS',
    'viewEmployees',
    'viewAttendance',
    'createAttendance',
    'viewPayroll',
    'viewEarnings',
    'viewDeductions',
    'viewHRReports',
    'exportHRReports',
  ],
  VIEWER: [
    'viewDashboard',
    'viewCustomers',
    'viewInvoices',
    'viewPayments',
    'viewReports',
    'viewSettings',
    'viewSubscriptions',
    'viewExpenses',
    'viewReimbursements',
  ]
}

export function hasPermission(userRole: Role, permission: keyof typeof permissions): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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