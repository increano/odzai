import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Account {
  id: string
  name: string
}

interface TransactionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (accountId: string, file: File, options: { defaultCleared: boolean, skipDuplicates: boolean }) => Promise<void>
  accounts: Account[]
  isImporting: boolean
  progress: number
}

export function TransactionImportDialog({
  open,
  onOpenChange,
  onImport,
  accounts,
  isImporting,
  progress
}: TransactionImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [defaultCleared, setDefaultCleared] = useState(true)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Check if it's a valid file type (CSV, OFX, QFX, etc.)
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/x-ofx',
        'application/ofx',
        'application/x-qfx',
        'application/qfx'
      ]
      
      // Some browsers might not recognize OFX/QFX mime types properly
      const validExtensions = ['.csv', '.ofx', '.qfx', '.xlsx', '.xls']
      
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => fileExtension === ext)
      
      if (!isValidType) {
        setError('Please select a valid transaction file (CSV, OFX, QFX, or Excel)')
        setSelectedFile(null)
        return
      }
      
      setSelectedFile(file)
      setError(null)
    }
  }
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const resetForm = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import')
      return
    }
    
    if (!selectedAccountId) {
      setError('Please select an account')
      return
    }
    
    setError(null)
    
    try {
      await onImport(
        selectedAccountId,
        selectedFile,
        { defaultCleared, skipDuplicates }
      )
      
      // If successful, reset form and close dialog
      resetForm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }
  
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} bytes`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Reset form when closing
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Import transactions from a CSV, OFX, QFX, or Excel file.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="account">Account</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              disabled={isImporting}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="file">Transaction File</Label>
            <div className="mt-1 flex items-center">
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".csv,.ofx,.qfx,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={isImporting}
              />
              
              <Button
                type="button"
                onClick={handleBrowseClick}
                variant="outline"
                className="mr-2"
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {selectedFile ? (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                ) : (
                  'No file selected'
                )}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="defaultCleared"
                checked={defaultCleared}
                onCheckedChange={(checked) => setDefaultCleared(checked === true)}
                disabled={isImporting}
              />
              <Label htmlFor="defaultCleared">Mark imported transactions as cleared</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipDuplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                disabled={isImporting}
              />
              <Label htmlFor="skipDuplicates">Skip potential duplicate transactions</Label>
            </div>
          </div>
          
          {isImporting && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% complete
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !selectedAccountId || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 