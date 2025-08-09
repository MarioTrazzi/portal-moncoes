"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText,
  Camera,
  Paperclip
} from 'lucide-react'

interface FileUploadProps {
  onFilesChange: (images: File[], documents: File[]) => void
  maxImages?: number
  maxDocuments?: number
  maxFileSize?: number // em MB
}

export function FileUpload({ 
  onFilesChange, 
  maxImages = 5, 
  maxDocuments = 3,
  maxFileSize = 10 
}: FileUploadProps) {
  const [images, setImages] = useState<File[]>([])
  const [documents, setDocuments] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo ${file.name} é muito grande. Máximo ${maxFileSize}MB.`
    }
    return null
  }

  const updateFiles = (newImages: File[], newDocuments: File[]) => {
    setImages(newImages)
    setDocuments(newDocuments)
    onFilesChange(newImages, newDocuments)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        alert(error)
        continue
      }
      
      if (images.length + validFiles.length >= maxImages) {
        alert(`Máximo de ${maxImages} imagens permitidas`)
        break
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      updateFiles([...images, ...validFiles], documents)
    }
    
    // Limpar input
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        alert(error)
        continue
      }
      
      if (documents.length + validFiles.length >= maxDocuments) {
        alert(`Máximo de ${maxDocuments} documentos permitidos`)
        break
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      updateFiles(images, [...documents, ...validFiles])
    }
    
    // Limpar input
    if (documentInputRef.current) {
      documentInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    updateFiles(newImages, documents)
  }

  const removeDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index)
    updateFiles(images, newDocuments)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    const imageFiles: File[] = []
    const documentFiles: File[] = []
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file)
      } else {
        documentFiles.push(file)
      }
    })
    
    // Processar imagens
    const validImages = imageFiles.slice(0, maxImages - images.length)
    // Processar documentos
    const validDocuments = documentFiles.slice(0, maxDocuments - documents.length)
    
    updateFiles([...images, ...validImages], [...documents, ...validDocuments])
  }

  const totalFiles = images.length + documents.length

  return (
    <div className="space-y-4">
      {/* Área de Drop */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <CardContent className="p-6 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Upload className="h-full w-full" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500">
              Imagens: JPG, PNG, GIF (máx. {maxImages}) • Documentos: PDF, DOC, XLS, TXT (máx. {maxDocuments})
              <br />
              Máximo {maxFileSize}MB por arquivo
            </p>
          </div>
          
          <div className="flex gap-2 justify-center mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={images.length >= maxImages}
            >
              <Camera className="mr-2 h-4 w-4" />
              Adicionar Fotos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => documentInputRef.current?.click()}
              disabled={documents.length >= maxDocuments}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Adicionar Documentos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs ocultos */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleDocumentSelect}
        className="hidden"
      />

      {/* Preview das Imagens */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Imagens ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square border rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Documentos */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos ({documents.length}/{maxDocuments})
          </h4>
          <div className="space-y-2">
            {documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-48">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contador de arquivos */}
      {totalFiles > 0 && (
        <div className="text-center">
          <Badge variant="outline">
            {totalFiles} arquivo(s) selecionado(s)
          </Badge>
        </div>
      )}
    </div>
  )
}
