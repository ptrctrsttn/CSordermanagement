'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';

type Tab = 'products' | 'stock' | 'gilmours' | 'bidfood' | 'other' | 'product-list';

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
  createdAt: Date;
  updatedAt: Date;
};

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [productList, setProductList] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
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
      const response = await fetch('/api/product-list');
      if (!response.ok) throw new Error('Failed to fetch product list');
      const data = await response.json();
      setProductList(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'product-list') {
      fetchProductList();
    }
  }, [activeTab]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', activeTab);

    try {
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh products after successful upload
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'product-list') {
        fetchProductList();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Stock Management</h1>
      
      <Tabs defaultValue="products" className="w-full" onValueChange={(value) => setActiveTab(value as Tab)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="product-list">Product List</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="gilmours">Gilmours</TabsTrigger>
          <TabsTrigger value="bidfood">Bidfood</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
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
                    onChange={handleFileUpload}
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
                    <tr key={product.id}>
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
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button>Add Product</Button>
            </div>
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
                  {productList.map((item) => (
                    <tr key={item.id}>
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
                        <Button variant="ghost" size="sm">Edit</Button>
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button>Add Stock Item</Button>
            </div>
          </div>
          {/* Stock items table will go here */}
        </TabsContent>

        <TabsContent value="gilmours" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gilmours Ingredients</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button>Add Ingredient</Button>
            </div>
          </div>
          {/* Gilmours ingredients table will go here */}
        </TabsContent>

        <TabsContent value="bidfood" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bidfood Ingredients</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button>Add Ingredient</Button>
            </div>
          </div>
          {/* Bidfood ingredients table will go here */}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Other Ingredients</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload size={16} />
                <label className="cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button>Add Ingredient</Button>
            </div>
          </div>
          {/* Other ingredients table will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 