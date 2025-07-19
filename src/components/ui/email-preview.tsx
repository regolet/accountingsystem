'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'

interface EmailPreviewProps {
  subject: string
  message: string
  sampleData?: {
    invoiceNumber: string
    amount: string
    customerName: string
    dueDate: string
    companyName: string
  }
}

export function EmailPreview({ subject, message, sampleData }: EmailPreviewProps) {
  const defaultSampleData = {
    invoiceNumber: 'INV-001',
    amount: '₱1,250.00',
    customerName: 'John Doe',
    dueDate: 'March 15, 2024',
    companyName: 'Your Company Name'
  }

  const data = sampleData || defaultSampleData

  const processTemplate = (template: string) => {
    return template
      .replace(/{invoiceNumber}/g, data.invoiceNumber)
      .replace(/{amount}/g, data.amount)
      .replace(/{customerName}/g, data.customerName)
      .replace(/{dueDate}/g, data.dueDate)
      .replace(/{companyName}/g, data.companyName)
  }

  const processedSubject = processTemplate(subject)
  const processedMessage = processTemplate(message)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* Email Header */}
          <div className="border-b pb-3 mb-4">
            <div className="text-xs text-gray-500 mb-1">From: {data.companyName} &lt;noreply@company.com&gt;</div>
            <div className="text-xs text-gray-500 mb-2">To: {data.customerName} &lt;customer@example.com&gt;</div>
            <div className="font-semibold text-sm">{processedSubject}</div>
          </div>
          
          {/* Email Body */}
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {processedMessage}
          </div>
          
          {/* Sample Invoice Preview */}
          <div className="mt-6 border-t pt-4">
            <div className="text-xs text-gray-500 mb-2">📎 Attachment: Invoice_{data.invoiceNumber}.pdf</div>
            
            {/* Mini Invoice Preview */}
            <div className="border rounded p-3 bg-white text-xs">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-lg">INVOICE</div>
                  <div className="text-gray-600">#{data.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg text-green-600">{data.amount}</div>
                  <div className="text-gray-600">Due: {data.dueDate}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t">
                <div>
                  <div className="font-semibold text-gray-700">Bill From:</div>
                  <div className="text-gray-600">{data.companyName}</div>
                  <div className="text-gray-600">company@example.com</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Bill To:</div>
                  <div className="text-gray-600">{data.customerName}</div>
                  <div className="text-gray-600">customer@example.com</div>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Web Development Services</span>
                  <span className="font-semibold">{data.amount}</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-gray-500">
                  <span>Quantity: 1 × ₱1,250.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          This is a preview of how your email will appear to customers. The actual invoice PDF will be attached to the email.
        </div>
      </CardContent>
    </Card>
  )
}