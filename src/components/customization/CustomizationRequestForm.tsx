'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Info, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Product, ProductWithDetails, ProductVariant } from '@/types/products';
import { ColorSelector } from '@/components/products/ColorSelector';
import { ProductColorWithDetails } from '@/components/products/ProductColorManager';
import { Button } from '@/components/ui/Button';

interface CustomizationRequestFormProps {
  product: Product | ProductWithDetails;
  onSubmit: (data: CustomizationFormData) => Promise<void>;
  onCancel: () => void;
  selectedVariants?: Record<string, string>;
  selectedColorId?: string;
  colorPriceAdjustment?: number;
  selectedBrand?: string;
  selectedPrintingType?: string;
}

export interface CustomizationFormData {
  productId: string;
  productName: string;
  productImage?: string;
  selectedColorId?: string;
  colorPriceAdjustment?: number;
  selectedBrand?: string; // T-shirt brand selection
  selectedPrintingType?: string; // Printing type selection
  quantity: number;
  customizationNotes: string;
  customerDesignFile?: any;
  customerPreviewImage?: any;
}

export function CustomizationRequestForm({ 
  product, 
  onSubmit, 
  onCancel,
  selectedVariants = {},
  selectedColorId: initialSelectedColorId = '',
  colorPriceAdjustment: initialColorPriceAdjustment = 0,
  selectedBrand: initialBrand = '',
  selectedPrintingType: initialPrintingType = ''
}: CustomizationRequestFormProps) {
  const [notes, setNotes] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [productColors, setProductColors] = useState<ProductColorWithDetails[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string>(initialSelectedColorId);
  const [colorPriceAdjustment, setColorPriceAdjustment] = useState<number>(initialColorPriceAdjustment);
  const [quantity, setQuantity] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || '');
  const [selectedPrintingType, setSelectedPrintingType] = useState<string>(initialPrintingType || '');
  const [isDraggingDesign, setIsDraggingDesign] = useState(false);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const designDropRef = useRef<HTMLDivElement>(null);
  const previewDropRef = useRef<HTMLDivElement>(null);
  
  // Get available brands from product, or use default list
  const tshirtBrands = (() => {
    const productBrands = ('availableBrands' in product && product.availableBrands) || [];
    if (productBrands.length > 0) {
      return [...productBrands, 'Other (Designer will recommend)'];
    }
    // Fallback to default list if product doesn't specify
    return [
      'Gildan',
      'Fruit of the Loom',
      'Hanes',
      'Champion',
      'Anvil',
      'Jerzees',
      'Port & Company',
      'Local/Generic Brand',
      'Other (Designer will recommend)'
    ];
  })();
  
  // Get available printing types from product, or use default list
  const printingTypes = (() => {
    const productTypes = ('availablePrintingTypes' in product && product.availablePrintingTypes) || [];
    if (productTypes.length > 0) {
      return [...productTypes, 'Other (Designer will recommend)'];
    }
    // Fallback to default list if product doesn't specify
    return [
      'Screen Print',
      'DTG (Direct to Garment)',
      'Heat Transfer',
      'Embroidery',
      'Sublimation',
      'Vinyl',
      'Other (Designer will recommend)'
    ];
  })();

  const MAX_NOTES_LENGTH = 2000;

  useEffect(() => {
    loadProductColors();
  }, [product.id]);

  const loadProductColors = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/colors`);
      if (response.ok) {
        const data = await response.json();
        setProductColors(data.productColors || []);
      }
    } catch (error) {
      console.error('Error loading product colors:', error);
    }
  };

  const handleColorSelect = (colorId: string, priceAdjustment: number) => {
    setSelectedColorId(colorId);
    setColorPriceAdjustment(priceAdjustment);
  };

  // Calculate total price including variants, color, and quantity
  const calculateTotalPrice = () => {
    let total = product.price;
    
    // Add variant price adjustments
    if ('variants' in product && product.variants) {
      Object.entries(selectedVariants).forEach(([variantName, variantValue]) => {
        const variant = product.variants.find(
          v => v.variantName === variantName && v.variantValue === variantValue
        );
        if (variant) {
          total += variant.priceAdjustment;
        }
      });
    }
    
    // Add color price adjustment
    total += colorPriceAdjustment;
    
    // Multiply by quantity
    return total * quantity;
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (product.stockQuantity === 0) {
      return;
    }
    if (newQuantity >= 1 && newQuantity <= (product.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Get selected variant display info
  const getSelectedVariantInfo = () => {
    if (!('variants' in product) || !product.variants || Object.keys(selectedVariants).length === 0) {
      return null;
    }

    const variantEntries = Object.entries(selectedVariants);
    if (variantEntries.length === 0) return null;

    const [variantName, variantValue] = variantEntries[0];
    const variant = product.variants.find(
      v => v.variantName === variantName && v.variantValue === variantValue
    );

    if (!variant) return null;

    return {
      name: variantName,
      value: variantValue,
      priceAdjustment: variant.priceAdjustment
    };
  };

  const validateFile = (file: File, type: 'design' | 'preview'): string | null => {
    if (type === 'design') {
      if (file.size > 20 * 1024 * 1024) {
        return 'Design file must be less than 20MB';
      }
    } else {
      if (file.size > 5 * 1024 * 1024) {
        return 'Preview image must be less than 5MB';
      }
      if (!file.type.startsWith('image/')) {
        return 'Preview must be an image file';
      }
    }
    return null;
  };

  const handleFileSelect = (file: File, type: 'design' | 'preview') => {
    const error = validateFile(file, type);
    if (error) {
      setError(error);
      return;
    }

    if (type === 'design') {
      setDesignFile(file);
    } else {
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    setError('');
  };

  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'design');
    }
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'preview');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, type: 'design' | 'preview') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'design') {
      setIsDraggingDesign(true);
    } else {
      setIsDraggingPreview(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: 'design' | 'preview') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'design') {
      setIsDraggingDesign(false);
    } else {
      setIsDraggingPreview(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'design' | 'preview') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'design') {
      setIsDraggingDesign(false);
    } else {
      setIsDraggingPreview(false);
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const uploadFile = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/customizations/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      if (!notes.trim()) {
        throw new Error('Please provide customization instructions');
      }

      // Files are optional - only upload if provided
      let designFileData = null;
      let previewFileData = null;

      if (designFile) {
        designFileData = await uploadFile(designFile, 'customer_design');
      }

      if (previewFile) {
        previewFileData = await uploadFile(previewFile, 'preview');
      }

      await onSubmit({
        productId: product.id,
        productName: product.name,
        productImage: ('images' in product && product.images?.[0]?.imageUrl) || undefined,
        selectedColorId: selectedColorId || undefined,
        colorPriceAdjustment: colorPriceAdjustment || 0,
        selectedBrand: selectedBrand || undefined,
        selectedPrintingType: selectedPrintingType || undefined,
        quantity: quantity,
        customizationNotes: notes,
        customerDesignFile: designFileData,
        customerPreviewImage: previewFileData
      });

    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setUploading(false);
    }
  };

  const variantInfo = getSelectedVariantInfo();
  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Product Summary (Col-span-4) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Product Image */}
              {('images' in product && product.images?.[0]?.imageUrl) && (
                <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={('images' in product ? product.images[0].imageUrl : '')}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Product Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{product.name}</h3>
                
                {/* Base Price */}
                <div className="text-sm text-slate-600 mb-4">
                  <span className="font-medium">Base Price:</span>{' '}
                  <span className="text-slate-900">₱{product.price.toFixed(2)}</span>
                </div>

                {/* Selected Variant */}
                {variantInfo && (
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="text-sm text-slate-700 mb-1">
                      <span className="font-medium">{variantInfo.name}:</span>{' '}
                      <span className="text-slate-900">{variantInfo.value}</span>
                    </div>
                    {variantInfo.priceAdjustment !== 0 && (
                      <div className="text-sm text-indigo-700">
                        {variantInfo.priceAdjustment > 0 ? '+' : ''}₱{variantInfo.priceAdjustment.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Color Selection */}
                {productColors.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-900 mb-2">Color</label>
                    <ColorSelector
                      productColors={productColors}
                      selectedColorId={selectedColorId}
                      onColorSelect={handleColorSelect}
                      basePrice={product.price}
                    />
                    {colorPriceAdjustment !== 0 && selectedColorId && (
                      <div className="mt-2 text-sm text-indigo-600">
                        {colorPriceAdjustment > 0 ? '+' : ''}₱{colorPriceAdjustment.toFixed(2)} color adjustment
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-900 mb-2">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1 || product.stockQuantity === 0}
                      className={`p-2 rounded-lg border border-slate-200 ${
                        quantity <= 1 || product.stockQuantity === 0
                          ? 'cursor-not-allowed opacity-50 bg-slate-100'
                          : 'hover:bg-slate-50 active:bg-slate-100'
                      } transition-colors`}
                    >
                      <Minus className="w-4 h-4 text-slate-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stockQuantity || 1}
                      value={product.stockQuantity === 0 ? 0 : quantity}
                      onChange={(e) => {
                        if (product.stockQuantity === 0) return;
                        const value = parseInt(e.target.value) || 1;
                        handleQuantityChange(Math.min(Math.max(value, 1), product.stockQuantity || 1));
                      }}
                      className="w-20 text-center px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-900"
                      disabled={product.stockQuantity === 0}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.stockQuantity || 1) || product.stockQuantity === 0}
                      className={`p-2 rounded-lg border border-slate-200 ${
                        quantity >= (product.stockQuantity || 1) || product.stockQuantity === 0
                          ? 'cursor-not-allowed opacity-50 bg-slate-100'
                          : 'hover:bg-slate-50 active:bg-slate-100'
                      } transition-colors`}
                    >
                      <Plus className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                  {product.stockQuantity > 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      {product.stockQuantity} {product.stockQuantity === 1 ? 'item' : 'items'} available
                    </p>
                  )}
                  {product.stockQuantity === 0 && (
                    <p className="mt-2 text-xs text-red-500">Out of stock</p>
                  )}
                </div>

                {/* Estimated Total */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Estimated Total</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ₱{totalPrice.toFixed(2)}
                    </span>
                  </div>
                  {quantity > 1 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {quantity} × ₱{(totalPrice / quantity).toFixed(2)} per item
                    </div>
                  )}
                  
                  {/* Info Note */}
                  <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600">
                        Final price may vary based on design complexity and customization requirements. The shop will provide a final quote after reviewing your request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Form (Col-span-8) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customization Instructions */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Customization Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_NOTES_LENGTH) {
                        setNotes(e.target.value);
                      }
                    }}
                    placeholder="Describe your design requirements, preferred colors, text, sizes, placement, etc. Be as detailed as possible to help the designer understand your vision."
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm text-slate-900 placeholder-slate-400 resize-none"
                    required
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Provide detailed instructions for best results
                    </span>
                    <span className={`text-xs ${
                      notes.length > MAX_NOTES_LENGTH * 0.9 
                        ? 'text-red-500' 
                        : 'text-slate-500'
                    }`}>
                      {notes.length} / {MAX_NOTES_LENGTH} characters
                    </span>
                  </div>
                </div>

                {/* T-Shirt Brand and Printing Type Display (Read-only, selected from product page) */}
                {(selectedBrand || selectedPrintingType) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Selected Options</h4>
                    {selectedBrand && (
                      <div>
                        <span className="text-xs text-slate-500">T-Shirt Brand:</span>
                        <p className="text-sm text-slate-900 font-medium mt-0.5">{selectedBrand}</p>
                      </div>
                    )}
                    {selectedPrintingType && (
                      <div>
                        <span className="text-xs text-slate-500">Printing Type:</span>
                        <p className="text-sm text-slate-900 font-medium mt-0.5">{selectedPrintingType}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 italic">
                      To change these selections, go back to the product page.
                    </p>
                  </div>
                )}

                {/* Design File Upload - Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Design File (Optional)
                  </label>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload your design file (AI, PSD, PDF, PNG, JPG, SVG - Max 20MB)
                  </p>
                  
                  {!designFile ? (
                    <div
                      ref={designDropRef}
                      onDragOver={(e) => handleDragOver(e, 'design')}
                      onDragLeave={(e) => handleDragLeave(e, 'design')}
                      onDrop={(e) => handleDrop(e, 'design')}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDraggingDesign
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                      }`}
                    >
                      <label className="flex flex-col items-center cursor-pointer">
                        <FileText className={`w-12 h-12 mb-3 ${
                          isDraggingDesign ? 'text-indigo-600' : 'text-slate-400'
                        }`} />
                        <span className="text-sm font-medium text-slate-700 mb-1">
                          Drop your design file here
                        </span>
                        <span className="text-xs text-slate-500">
                          or click to browse
                        </span>
                        <input
                          type="file"
                          onChange={handleDesignFileChange}
                          accept=".ai,.psd,.pdf,.png,.jpg,.jpeg,.svg"
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-indigo-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{designFile.name}</p>
                            <p className="text-xs text-slate-500">
                              {(designFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDesignFile(null)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Image Upload - Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Visual Reference (Optional)
                  </label>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload a mockup or preview image (JPG, PNG - Max 5MB)
                  </p>
                  
                  {!previewFile ? (
                    <div
                      ref={previewDropRef}
                      onDragOver={(e) => handleDragOver(e, 'preview')}
                      onDragLeave={(e) => handleDragLeave(e, 'preview')}
                      onDrop={(e) => handleDrop(e, 'preview')}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDraggingPreview
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                      }`}
                    >
                      <label className="flex flex-col items-center cursor-pointer">
                        <ImageIcon className={`w-12 h-12 mb-3 ${
                          isDraggingPreview ? 'text-indigo-600' : 'text-slate-400'
                        }`} />
                        <span className="text-sm font-medium text-slate-700 mb-1">
                          Drop your preview image here
                        </span>
                        <span className="text-xs text-slate-500">
                          or click to browse
                        </span>
                        <input
                          type="file"
                          onChange={handlePreviewFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="w-8 h-8 text-indigo-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{previewFile.name}</p>
                              <p className="text-xs text-slate-500">
                                {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewFile(null);
                              setPreviewUrl('');
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {previewUrl && (
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-auto max-h-64 object-contain bg-slate-50"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    disabled={uploading}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    {uploading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
