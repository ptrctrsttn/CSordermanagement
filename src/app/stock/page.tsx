'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { CsvUploader } from '@/components/stock/CsvUploader';
import { StockItemEditor } from '@/components/stock/StockItemEditor';
import { GilmoursItem, BidfoodItem, OtherItem, StockItem } from '@/types/stock';
import { OtherItemEditor } from '@/components/stock/OtherItemEditor';
import { ProductListEditor } from '@/components/stock/ProductListEditor';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Tab = 'products' | 'stock' | 'gilmours' | 'bidfood' | 'other' | 'product-list' | 'drivers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
};

type ProductList = {
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
  createdAt?: Date;
  updatedAt?: Date;
};

type Driver = {
  id: string;
  name: string;
};

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [productList, setProductList] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [gilmoursItems, setGilmoursItems] = useState<GilmoursItem[]>([]);
  const [bidfoodItems, setBidfoodItems] = useState<BidfoodItem[]>([]);
  const [otherItems, setOtherItems] = useState<OtherItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedGilmoursItem, setSelectedGilmoursItem] = useState<GilmoursItem | null>(null);
  const [isGilmoursModalOpen, setIsGilmoursModalOpen] = useState(false);
  const [selectedBidfoodItem, setSelectedBidfoodItem] = useState<BidfoodItem | null>(null);
  const [isBidfoodModalOpen, setIsBidfoodModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-list`);
      if (!response.ok) throw new Error('Failed to fetch product list');
      const data = await response.json();
      setProductList(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchStockItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock`);
      if (!response.ok) throw new Error('Failed to fetch stock items');
      const data = await response.json();
      setStockItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const fetchGilmoursItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/gilmours`);
      if (!response.ok) throw new Error('Failed to fetch Gilmours items');
      const data = await response.json();
      setGilmoursItems(data);
    } catch (error) {
      console.error('Error fetching Gilmours items:', error);
    }
  };

  const fetchBidfoodItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/bidfood`);
      if (!response.ok) throw new Error('Failed to fetch Bidfood items');
      const data = await response.json();
      setBidfoodItems(data);
    } catch (error) {
      console.error('Error fetching Bidfood items:', error);
    }
  };

  const fetchOtherItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/other`);
      if (!response.ok) throw new Error('Failed to fetch other items');
      const data = await response.json();
      setOtherItems(data);
    } catch (error) {
      console.error('Error fetching other items:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'product-list') {
      fetchProductList();
    } else if (activeTab === 'drivers') {
      fetchDrivers();
    } else if (activeTab === 'stock') {
      fetchStockItems();
    } else if (activeTab === 'gilmours') {
      fetchGilmoursItems();
    } else if (activeTab === 'bidfood') {
      fetchBidfoodItems();
    } else if (activeTab === 'other') {
      fetchOtherItems();
    }
  }, [activeTab]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', activeTab);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh items after successful upload
      if (activeTab === 'gilmours') {
        fetchGilmoursItems();
      } else if (activeTab === 'bidfood') {
        fetchBidfoodItems();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStockItem = async (item: StockItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock`, {
        method: item.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error('Failed to save stock item');
      fetchStockItems();
    } catch (error) {
      console.error('Error saving stock item:', error);
      alert('Failed to save stock item');
    }
  };

  const handleSaveOtherItem = async (item: Omit<OtherItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/other`, {
        method: item.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error('Failed to save other item');
      fetchOtherItems();
    } catch (error) {
      console.error('Error saving other item:', error);
      alert('Failed to save other item');
    }
  };

  const handleSaveProductList = async (item: ProductList) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to save product list item');
      await fetchProductList();
    } catch (error) {
      console.error('Error saving product list item:', error);
    }
  };

  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProductList = productList.filter(item =>
    item.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.addon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Stock Management</h1>
      
      <Tabs defaultValue="products" className="w-full" onValueChange={(value) => setActiveTab(value as Tab)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="product-list">Product List</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="gilmours">Gilmours</TabsTrigger>
          <TabsTrigger value="bidfood">Bidfood</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </Button>
              <Button>Add Product</Button>
            </div>
          </div>
          
          {loading ? (
            <div>Loading products...</div>
          ) : (
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr 
                      key={product.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsProductModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.sku || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="product-list" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Product List</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <ProductListEditor onSave={handleSaveProductList} />
          </div>

          {loading ? (
            <div>Loading product list...</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Addon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List of Ing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meat 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meat 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serveware</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timer A</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timer B</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU Search</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductList.map((item) => (
                    <tr 
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const button = document.querySelector(`[data-product-id="${item.id}"]`);
                        if (button) {
                          (button as HTMLButtonElement).click();
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{item.addon}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.handle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.totalCost || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.listOfIng || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.meat1 || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.meat2 || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.option1 || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.option2 || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.serveware || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.timerA || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.timerB || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.skuSearch || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.variantSku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProductListEditor item={item} onSave={handleSaveProductList} data-product-id={item.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stock Items</h2>
            <StockItemEditor onSave={handleSaveStockItem} />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stock items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {loading ? (
            <div>Loading stock items...</div>
          ) : (
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStockItems.map((item) => (
                    <tr 
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const editor = document.querySelector(`[data-stock-id="${item.id}"]`);
                        if (editor) {
                          (editor as HTMLElement).click();
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${item.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4">{item.subItems.length} items</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockItemEditor item={item} onSave={handleSaveStockItem} data-stock-id={item.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gilmours" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gilmours Items</h2>
            <CsvUploader onUpload={handleFileUpload} />
          </div>

          {loading ? (
            <div>Loading Gilmours items...</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gilmoursItems.map((item, index) => (
                    <tr 
                      key={index}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedGilmoursItem(item);
                        setIsGilmoursModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{item.purchaseDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.brand}</td>
                      <td className="px-6 py-4">{item.productDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.packSize}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bidfood" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bidfood Items</h2>
            <CsvUploader onUpload={handleFileUpload} />
          </div>

          {loading ? (
            <div>Loading Bidfood items...</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ctn Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total ex GST</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bidfoodItems.map((item, index) => (
                    <tr 
                      key={index}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedBidfoodItem(item);
                        setIsBidfoodModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{item.productCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.brand}</td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.packSize}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.ctnQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.lastPricePaid}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.totalExGst}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Other Items</h2>
            <OtherItemEditor onSave={handleSaveOtherItem} />
          </div>

          {loading ? (
            <div>Loading other items...</div>
          ) : (
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {otherItems.map((item) => (
                    <tr 
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const editor = document.querySelector(`[data-other-id="${item.id}"]`);
                        if (editor) {
                          (editor as HTMLElement).click();
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.supplier}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${item.pricePerUnit.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OtherItemEditor item={item} onSave={handleSaveOtherItem} data-other-id={item.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Delivery Drivers</h2>
            <Button onClick={() => {
              const name = prompt("Enter driver's first name:");
              if (name) {
                // Add driver to database
                fetch(`${API_BASE_URL}/api/drivers`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ name }),
                }).then(() => {
                  // Refresh the drivers list
                  fetchDrivers();
                });
              }
            }}>Add Driver</Button>
          </div>
          
          <div className="border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{driver.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${driver.name}?`)) {
                            fetch(`${API_BASE_URL}/api/drivers/${driver.id}`, {
                              method: 'DELETE',
                            }).then(() => {
                              // Refresh the drivers list
                              fetchDrivers();
                            });
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Edit Dialog */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={selectedProduct.sku || ''}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      sku: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      price: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Add save functionality here
                  setIsProductModalOpen(false);
                }}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gilmours Details Dialog */}
      <Dialog open={isGilmoursModalOpen} onOpenChange={setIsGilmoursModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gilmours Item Details</DialogTitle>
          </DialogHeader>
          {selectedGilmoursItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <div>{selectedGilmoursItem.purchaseDate}</div>
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <div>{selectedGilmoursItem.sku}</div>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <div>{selectedGilmoursItem.brand}</div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div>{selectedGilmoursItem.productDescription}</div>
                </div>
                <div className="space-y-2">
                  <Label>Pack Size</Label>
                  <div>{selectedGilmoursItem.packSize}</div>
                </div>
                <div className="space-y-2">
                  <Label>UOM</Label>
                  <div>{selectedGilmoursItem.uom}</div>
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <div>{selectedGilmoursItem.price}</div>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div>{selectedGilmoursItem.qty}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsGilmoursModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bidfood Details Dialog */}
      <Dialog open={isBidfoodModalOpen} onOpenChange={setIsBidfoodModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bidfood Item Details</DialogTitle>
          </DialogHeader>
          {selectedBidfoodItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Code</Label>
                  <div>{selectedBidfoodItem.productCode}</div>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <div>{selectedBidfoodItem.brand}</div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div>{selectedBidfoodItem.description}</div>
                </div>
                <div className="space-y-2">
                  <Label>Pack Size</Label>
                  <div>{selectedBidfoodItem.packSize}</div>
                </div>
                <div className="space-y-2">
                  <Label>Ctn Qty</Label>
                  <div>{selectedBidfoodItem.ctnQty}</div>
                </div>
                <div className="space-y-2">
                  <Label>UOM</Label>
                  <div>{selectedBidfoodItem.uom}</div>
                </div>
                <div className="space-y-2">
                  <Label>Last Price</Label>
                  <div>{selectedBidfoodItem.lastPricePaid}</div>
                </div>
                <div className="space-y-2">
                  <Label>Total ex GST</Label>
                  <div>{selectedBidfoodItem.totalExGst}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsBidfoodModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 