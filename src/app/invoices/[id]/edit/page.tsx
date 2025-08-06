'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

interface Customer {
  id: string
  name: string
  email: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  customer: Customer
  items: InvoiceItem[]
  subtotal: string
  tax: string
  total: string
  currency: string
  notes?: string
}

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    dueDate: '',
    tax: 0,
    notes: '',
  })
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: number
  }>>([])

  useEffect(() => {
    fetchInvoice()
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
        setFormData({
          customerId: data.customer.id,
          dueDate: data.dueDate.split('T')[0],
          tax: parseFloat(data.tax),
          notes: data.notes || '',
        })
        setInvoiceItems(data.items.map((item: InvoiceItem) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
        })))
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    }
  }

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...invoiceItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setInvoiceItems(updatedItems)
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const validItems = invoiceItems.filter(item => item.description && item.quantity > 0)
    if (validItems.length === 0) {
      alert('Please add at least one valid item')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          dueDate: formData.dueDate,
          tax: formData.tax,
          notes: formData.notes,
          items: validItems.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })
      
      if (response.ok) {
        alert('Invoice updated successfully!')
        router.push(`/invoices/${params.id}`)
      } else {
        const errorData = await response.json()
        alert(`Failed to update invoice: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
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
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/invoices/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoice
        </Button>
        <h1 className="text-3xl font-bold">Edit {invoice.invoiceNumber}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Customer *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date *</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Items *</label>
              <div className="space-y-3">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Description"
                      className="flex-1 px-3 py-2 border rounded-md"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-20 px-3 py-2 border rounded-md"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      step="0.01"
                      className="w-32 px-3 py-2 border rounded-md"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                    <span className="w-32 text-right">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                    {invoiceItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tax Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-600">Subtotal: {formatCurrency(calculateSubtotal())}</p>
                <p className="text-sm text-gray-600">Tax: {formatCurrency(formData.tax)}</p>
                <p className="text-lg font-semibold">Total: {formatCurrency(calculateSubtotal() + formData.tax)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => router.push(`/invoices/${params.id}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}