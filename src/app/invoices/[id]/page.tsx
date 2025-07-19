'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Coins, 
  Edit, 
  Trash2, 
  Send, 
  Download,
  Building2,
  Phone,
  Mail,
  Printer
} from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: Address
  taxId?: string
}

interface Transaction {
  id: string
  type: string
  amount: string
  date: string
  description: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  customer: Customer
  items: InvoiceItem[]
  transactions: Transaction[]
  subtotal: string
  tax: string
  total: string
  currency: string
  notes?: string
}

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<{
    companyName: string;
    email: string;
    phone?: string;
    address?: string;
    taxId?: string;
  } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
      fetchCompanyInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        console.error('Failed to fetch invoice')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setCompanyInfo(data.companyInfo)
      }
    } catch (error) {
      console.error('Error fetching company info:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice?.invoiceNumber || 'invoice'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
  }

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        fetchInvoice()
        alert(`Invoice marked as ${newStatus.toLowerCase()}`)
      } else {
        alert('Failed to update invoice status')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice status')
    } finally {
      setUpdating(false)
    }
  }

  const deleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        alert('Invoice deleted successfully')
        router.push('/invoices')
      } else {
        alert('Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  const sendInvoiceEmail = async () => {
    if (!invoice?.customer?.email) {
      alert('Customer email is not available')
      return
    }

    setSendingEmail(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Invoice email sent successfully to ${result.recipient}`)
        
        // Also update status to SENT if not already
        if (invoice.status === 'DRAFT') {
          await updateStatus('SENT')
        }
      } else {
        const errorData = await response.json()
        
        // Handle specific error codes with helpful messages
        if (errorData.code === 'EMAIL_NOT_ENABLED') {
          alert('❌ Email sending is not enabled.\n\nPlease go to Settings → Gmail SMTP Settings and enable email sending for your account.')
        } else if (errorData.code === 'EMAIL_NOT_CONFIGURED') {
          alert('⚙️ Email settings are incomplete.\n\nPlease go to Settings → Gmail SMTP Settings and configure your Gmail email and app password.')
        } else if (errorData.code === 'EMAIL_SEND_FAILED') {
          alert('📧 Failed to send email.\n\nCommon issues:\n• Incorrect Gmail app password\n• Invalid SMTP settings\n• Recipient email blocked\n\nPlease check your email settings and try again.')
        } else {
          alert(`Failed to send email: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Email sending error:', error)
      alert('❌ Failed to send invoice email due to network error. Please try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setProcessingPayment(true)
    try {
      // Create a transaction for the payment
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCOME',
          category: 'Invoice Payment',
          amount: parseFloat(paymentAmount),
          currency: invoice?.currency || 'PHP',
          description: paymentDescription,
          date: new Date().toISOString(),
          invoiceId: params.id,
        }),
      })

      if (!transactionResponse.ok) {
        throw new Error('Failed to create transaction')
      }

      // Update invoice status to PAID if full amount is paid
      if (parseFloat(paymentAmount) >= parseFloat(invoice?.total || '0')) {
        const statusResponse = await fetch(`/api/invoices/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PAID' }),
        })

        if (!statusResponse.ok) {
          throw new Error('Failed to update invoice status')
        }
      }

      // Refresh invoice data
      await fetchInvoice()
      
      // Close modal and reset form
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentDescription('')
      
      alert('Payment processed successfully')
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  const formatCurrency = (amount: string, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount))
  }

  const formatAddress = (address: Address | string) => {
    if (typeof address === 'string') {
      return address
    }
    
    if (!address) return ''
    
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    if (address.country) parts.push(address.country)
    
    return parts.join(', ')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Invoice not found</p>
          <Button onClick={() => router.push('/invoices')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .print-container {
            padding: 20px;
          }
          .print-invoice-header {
            border-bottom: 2px solid #000;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }
          .print-bill-info {
            margin-bottom: 20px;
          }
          .print-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .print-items-table th,
          .print-items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .print-items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-items-table .text-right {
            text-align: right;
          }
          .print-totals {
            margin-top: 20px;
            text-align: right;
          }
          .print-total-row {
            margin-bottom: 5px;
          }
          .print-total-final {
            border-top: 2px solid #000;
            padding-top: 5px;
            font-weight: bold;
          }
          .print-notes {
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
          .card-wrapper {
            display: none;
          }
          /* Hide all navigation elements */
          nav, .sidebar, .navigation, .navbar, .header, .menu {
            display: none !important;
          }
          /* Hide specific layout elements */
          .layout-sidebar, .layout-header, .main-nav {
            display: none !important;
          }
          /* Hide the sidebar specifically */
          .flex-col.w-64.bg-gray-900,
          .w-64.bg-gray-900 {
            display: none !important;
          }
          /* Restructure the main layout for print */
          .flex.h-screen.bg-gray-100 {
            display: block !important;
            height: auto !important;
            background: white !important;
          }
          /* Ensure main content is visible and full width */
          .flex.h-screen.bg-gray-100 > main {
            display: block !important;
            flex: none !important;
            width: 100% !important;
            overflow: visible !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
      
    <div className="p-8 print-container">
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/invoices')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        
        <div className="flex gap-2">
          <RoleGuard permission="editInvoices">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </RoleGuard>
          
          {invoice.status === 'DRAFT' && (
            <RoleGuard permission="sendInvoices">
              <Button 
                size="sm" 
                onClick={sendInvoiceEmail}
                disabled={sendingEmail || !invoice.customer?.email}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingEmail ? 'Sending...' : 'Send Invoice'}
              </Button>
            </RoleGuard>
          )}
          
          {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
            <RoleGuard permission="editInvoices">
              <Button 
                size="sm" 
                onClick={() => {
                  setPaymentAmount(invoice.total)
                  setPaymentDescription(`Payment for Invoice ${invoice.invoiceNumber}`)
                  setShowPaymentModal(true)
                }}
                disabled={updating}
              >
                <Coins className="h-4 w-4 mr-2" />
                Pay
              </Button>
            </RoleGuard>
          )}
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          <RoleGuard permission="deleteInvoices">
            <Button 
              variant="danger" 
              size="sm" 
              onClick={deleteInvoice}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* Print-only content */}
      <div className="print-only">
        {/* Print Invoice Header */}
        <div className="print-invoice-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>INVOICE</h1>
              <p style={{ fontSize: '18px', margin: '0' }}>#{invoice.invoiceNumber}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0' }}><strong>Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Print Bill Info */}
        <div className="print-bill-info">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Bill From:</h3>
              {companyInfo ? (
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{companyInfo.companyName}</p>
                  <p style={{ margin: '0 0 5px 0' }}>{companyInfo.email}</p>
                  {companyInfo.phone && <p style={{ margin: '0 0 5px 0' }}>{companyInfo.phone}</p>}
                  {companyInfo.address && <p style={{ margin: '0 0 5px 0' }}>{companyInfo.address}</p>}
                  {companyInfo.taxId && <p style={{ margin: '0 0 5px 0' }}>Tax ID: {companyInfo.taxId}</p>}
                </div>
              ) : (
                <p>Company Information</p>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Bill To:</h3>
              <div>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{invoice.customer.name}</p>
                <p style={{ margin: '0 0 5px 0' }}>{invoice.customer.email}</p>
                {invoice.customer.phone && <p style={{ margin: '0 0 5px 0' }}>{invoice.customer.phone}</p>}
                {invoice.customer.address && (
                  <p style={{ margin: '0 0 5px 0' }}>
                    {formatAddress(invoice.customer.address)}
                  </p>
                )}
                {invoice.customer.taxId && <p style={{ margin: '0 0 5px 0' }}>Tax ID: {invoice.customer.taxId}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Print Items Table */}
        <table className="print-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="text-right">{formatCurrency(item.total, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Totals */}
        <div className="print-totals">
          <div className="print-total-row">
            <span>Subtotal: {formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="print-total-row">
            <span>Tax: {formatCurrency(invoice.tax, invoice.currency)}</span>
          </div>
          <div className="print-total-row print-total-final">
            <span>Total: {formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {/* Print Notes */}
        {invoice.notes && (
          <div className="print-notes">
            <h3 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Notes:</h3>
            <p style={{ margin: '0' }}>{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 no-print">
        {/* Invoice Header */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Bill From
                </h3>
                {companyInfo ? (
                  <div className="space-y-2">
                    <p className="font-medium">{companyInfo.companyName}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {companyInfo.email}
                    </p>
                    {companyInfo.phone && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {companyInfo.phone}
                      </p>
                    )}
                    {companyInfo.address && (
                      <div className="text-sm text-gray-600">
                        {companyInfo.address}
                      </div>
                    )}
                    {companyInfo.taxId && (
                      <p className="text-sm text-gray-600">
                        Tax ID: {companyInfo.taxId}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading company information...</p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Bill To
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{invoice.customer.name}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {invoice.customer.email}
                  </p>
                  {invoice.customer.phone && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {invoice.customer.phone}
                    </p>
                  )}
                  {invoice.customer.address && (
                    <div className="text-sm text-gray-600">
                      {formatAddress(invoice.customer.address)}
                    </div>
                  )}
                  {invoice.customer.taxId && (
                    <p className="text-sm text-gray-600">
                      Tax ID: {invoice.customer.taxId}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right md:col-span-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Issue Date:</span>
                    <span className="text-sm">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className="text-sm">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-center py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">{item.description}</td>
                      <td className="text-center py-4 px-4">{item.quantity}</td>
                      <td className="text-right py-4 px-4">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="text-right py-4 px-4 font-medium">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Transactions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Transactions */}
          {invoice.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(transaction.amount, invoice.currency)}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Enter Payment Details</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={processingPayment}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Amount</label>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {invoice.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full pl-16 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={processingPayment}
                    />
                  </div>
                  {parseFloat(paymentAmount) < parseFloat(invoice.total) && parseFloat(paymentAmount) > 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      This is a partial payment. The invoice will remain in {invoice.status} status.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    disabled={processingPayment}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={processPayment}
                      disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                      className="flex-1"
                    >
                      {processingPayment ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Coins className="h-4 w-4 mr-2" />
                          Process Payment
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowPaymentModal(false)}
                      disabled={processingPayment}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}