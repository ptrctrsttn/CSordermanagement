import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductList {
  id: string;
  addon: string;
  handle: string;
  totalCost: string | null;
  listOfIng: string | null;
  meat1: string | null;
  meat2: string | null;
  option1: string | null;
  option2: string | null;
  serveware: string | null;
  timerA: string | null;
  timerB: string | null;
  skuSearch: string | null;
  variantSku: string;
}

interface ProductListEditorProps {
  item?: ProductList;
  onSave: (item: ProductList) => Promise<void>;
  'data-product-id'?: string;
}

export function ProductListEditor({ item, onSave, 'data-product-id': dataProductId }: ProductListEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ProductList>({
    id: item?.id || '',
    addon: item?.addon || '',
    handle: item?.handle || '',
    totalCost: item?.totalCost || '',
    listOfIng: item?.listOfIng || '',
    meat1: item?.meat1 || '',
    meat2: item?.meat2 || '',
    option1: item?.option1 || '',
    option2: item?.option2 || '',
    serveware: item?.serveware || '',
    timerA: item?.timerA || '',
    timerB: item?.timerB || '',
    skuSearch: item?.skuSearch || '',
    variantSku: item?.variantSku || ''
  });

  const handleChange = (field: keyof ProductList, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={item ? "ghost" : "default"} size="sm" data-product-id={dataProductId}>
          {item ? 'Edit' : 'Add Product'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addon">Addon</Label>
              <Input
                id="addon"
                value={formData.addon}
                onChange={(e) => handleChange('addon', e.target.value)}
                placeholder="Enter addon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => handleChange('handle', e.target.value)}
                placeholder="Enter handle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost</Label>
              <Input
                id="totalCost"
                value={formData.totalCost || ''}
                onChange={(e) => handleChange('totalCost', e.target.value)}
                placeholder="Enter total cost"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="listOfIng">List of Ingredients</Label>
              <Input
                id="listOfIng"
                value={formData.listOfIng || ''}
                onChange={(e) => handleChange('listOfIng', e.target.value)}
                placeholder="Enter list of ingredients"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meat1">Meat 1</Label>
              <Input
                id="meat1"
                value={formData.meat1 || ''}
                onChange={(e) => handleChange('meat1', e.target.value)}
                placeholder="Enter meat 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meat2">Meat 2</Label>
              <Input
                id="meat2"
                value={formData.meat2 || ''}
                onChange={(e) => handleChange('meat2', e.target.value)}
                placeholder="Enter meat 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="option1">Option 1</Label>
              <Input
                id="option1"
                value={formData.option1 || ''}
                onChange={(e) => handleChange('option1', e.target.value)}
                placeholder="Enter option 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="option2">Option 2</Label>
              <Input
                id="option2"
                value={formData.option2 || ''}
                onChange={(e) => handleChange('option2', e.target.value)}
                placeholder="Enter option 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serveware">Serveware</Label>
              <Input
                id="serveware"
                value={formData.serveware || ''}
                onChange={(e) => handleChange('serveware', e.target.value)}
                placeholder="Enter serveware"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timerA">Timer A</Label>
              <Input
                id="timerA"
                value={formData.timerA || ''}
                onChange={(e) => handleChange('timerA', e.target.value)}
                placeholder="Enter timer A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timerB">Timer B</Label>
              <Input
                id="timerB"
                value={formData.timerB || ''}
                onChange={(e) => handleChange('timerB', e.target.value)}
                placeholder="Enter timer B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skuSearch">SKU Search</Label>
              <Input
                id="skuSearch"
                value={formData.skuSearch || ''}
                onChange={(e) => handleChange('skuSearch', e.target.value)}
                placeholder="Enter SKU search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variantSku">Variant SKU</Label>
              <Input
                id="variantSku"
                value={formData.variantSku}
                onChange={(e) => handleChange('variantSku', e.target.value)}
                placeholder="Enter variant SKU"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 