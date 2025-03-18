import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StockItem, StockSubItem } from '@/types/stock';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

interface StockItemEditorProps {
  item?: StockItem;
  onSave: (item: Omit<StockItem, 'id'> & { id?: string }) => Promise<void>;
}

export function StockItemEditor({ item, onSave }: StockItemEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(item?.name || '');
  const [subItems, setSubItems] = useState<StockSubItem[]>(item?.subItems || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    source: StockSubItem['source'];
    packSize: string;
    ctnQty: string;
    lastPrice: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Create a debounced version of handleSearch
  const debouncedSearch = useCallback(
    debounce((query: string) => handleSearch(query), 300),
    []
  );

  // Call debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    // Cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleAddSubItem = (result: typeof searchResults[0]) => {
    const newSubItem: StockSubItem = {
      id: crypto.randomUUID(),
      productId: result.id,
      productName: result.name,
      price: result.price,
      quantity: 1,
      unit: result.unit,
      source: result.source,
      packSize: result.packSize,
      ctnQty: result.ctnQty,
      lastPrice: result.lastPrice
    };
    setSubItems([...subItems, newSubItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setSubItems(subItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems(subItems.filter(item => item.id !== id));
  };

  const calculateTotalCost = () => {
    return subItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSave = async () => {
    const stockItem = {
      ...(item?.id && { id: item.id }),
      name,
      totalCost: calculateTotalCost(),
      subItems
    };
    await onSave(stockItem);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={item ? "ghost" : "default"} size="sm">
          {item ? 'Edit' : 'Add Item'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Stock Item' : 'Add Stock Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter stock item name"
            />
          </div>

          <div className="space-y-2">
            <Label>Add Ingredients</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-md divide-y">
                {searchResults.map(result => (
                  <div key={result.id} className="p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-500">
                        ${result.price.toFixed(2)} per {result.unit}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubItem(result)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {subItems.length > 0 && (
            <div className="space-y-2">
              <Label>Sub-items</Label>
              <div className="border rounded-md divide-y">
                {subItems.map(subItem => (
                  <div key={subItem.id} className="p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{subItem.productName}</div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>${subItem.price.toFixed(2)} per {subItem.unit}</div>
                        <div>Pack Size: {subItem.packSize} | Ctn Qty: {subItem.ctnQty} | Last Price: {subItem.lastPrice}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={subItem.quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleQuantityChange(subItem.id, parseFloat(e.target.value))}
                        className="w-20"
                        min="0"
                        step="0.1"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSubItem(subItem.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-3 font-medium text-right">
                  Total Cost: ${calculateTotalCost().toFixed(2)}
                </div>
              </div>
            </div>
          )}
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