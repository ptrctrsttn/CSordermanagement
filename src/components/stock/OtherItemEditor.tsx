import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OtherItem } from '@/types/stock';

interface OtherItemEditorProps {
  item?: OtherItem;
  onSave: (item: Omit<OtherItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function OtherItemEditor({ item, onSave }: OtherItemEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sku, setSku] = useState(item?.sku || '');
  const [productName, setProductName] = useState(item?.productName || '');
  const [supplier, setSupplier] = useState(item?.supplier || '');
  const [pricePerUnit, setPricePerUnit] = useState(item?.pricePerUnit || 0);

  const handleSave = async () => {
    await onSave({
      ...(item?.id && { id: item.id }),
      sku,
      productName,
      supplier,
      pricePerUnit
    });
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={item ? "ghost" : "default"} size="sm">
          {item ? 'Edit' : 'Add Item'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Enter SKU"
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="pricePerUnit">Price per Unit</Label>
            <Input
              id="pricePerUnit"
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(parseFloat(e.target.value))}
              placeholder="Enter price per unit"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 