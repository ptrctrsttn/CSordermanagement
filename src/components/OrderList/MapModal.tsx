'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MapModalProps {
  address: string;
  isOpen: boolean;
  onClose: () => void;
  onDurationUpdate: (duration: string) => void;
  orderId: string;
  isManualTravelTime: boolean;
}

const START_ADDRESS = "562 richmond road grey lynn";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const MapModal: React.FC<MapModalProps> = ({ 
  address,
  isOpen,
  onClose,
  onDurationUpdate,
  orderId,
  isManualTravelTime
}) => {
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get coordinates first
        const geocodeResponse = await fetch(`/api/maps?type=geocode&address=${encodeURIComponent(address)}`);
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.results && geocodeData.results[0]) {
          const location = geocodeData.results[0].geometry.location;
          setCoordinates(location);
        }

        // Then get distance and duration
        const distanceResponse = await fetch(
          `/api/maps?type=distancematrix&address=${encodeURIComponent(address)}&startAddress=${encodeURIComponent(START_ADDRESS)}`
        );
        const distanceData = await distanceResponse.json();
        
        if (distanceData.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = distanceData.rows[0].elements[0];
          setDistance(element.distance.text);
          setDuration(element.duration.text);
          
          // Extract minutes from duration text
          const minutes = parseInt(element.duration.text.split(' ')[0]);
          if (!isNaN(minutes)) {
            // Update travel time through WebSocket
            const ws = new WebSocket('ws://localhost:3002');
            ws.onopen = () => {
              ws.send(JSON.stringify({
                type: 'ORDER_UPDATE',
                orderId: orderId,
                updates: {
                  travelTime: minutes,
                  isManualTravelTime: isManualTravelTime
                }
              }));
              ws.close();
            };

            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
              setError('Failed to update travel time. Please try again.');
            };

            // Update UI immediately
            onDurationUpdate(element.duration.text);
          }
        }
      } catch (error) {
        console.error('Error fetching map data:', error);
        setError('Failed to load map data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, address, orderId, isManualTravelTime, onDurationUpdate]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const encodedStartAddress = encodeURIComponent(START_ADDRESS);
  const encodedDestAddress = encodeURIComponent(address);
  const directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${encodedStartAddress}&destination=${encodedDestAddress}`;
  const streetViewUrl = coordinates 
    ? `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${coordinates.lat},${coordinates.lng}&heading=210&pitch=0&fov=100`
    : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Delivery Route & Location</h2>
            <div className="text-sm text-gray-600 mt-1">
              <div>From: {START_ADDRESS}</div>
              <div>To: {address}</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Route Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Distance:</span>
                <span className="font-medium">{distance || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Travel Time:</span>
                <span className="font-medium">{duration || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Delivery Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Address:</span>
                <span className="font-medium">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Location:</span>
                <span className="font-medium">{START_ADDRESS}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[400px] rounded-lg overflow-hidden">
            <iframe
              title="Delivery Route"
              width="100%"
              height="100%"
              frameBorder="0"
              src={directionsUrl}
              allowFullScreen
              className="rounded-lg"
            />
          </div>
          <div className="h-[400px] rounded-lg overflow-hidden">
            {streetViewUrl ? (
              <iframe
                title="Destination Street View"
                width="100%"
                height="100%"
                frameBorder="0"
                src={streetViewUrl}
                allowFullScreen
                className="rounded-lg"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                Loading street view...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 