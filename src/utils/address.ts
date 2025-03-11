export interface AddressData {
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string | null;
}

export const parseAddress = (addressString: string): AddressData | null => {
  try {
    return JSON.parse(addressString);
  } catch (e) {
    console.error('Error parsing address:', e);
    return null;
  }
};

export const formatAddress = (addressData: AddressData | null): string => {
  if (!addressData) return '-';
  
  const parts = [
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.province,
    addressData.zip,
    addressData.country
  ].filter(Boolean);
  
  return parts.join(', ');
}; 