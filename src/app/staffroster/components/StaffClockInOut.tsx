'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ClockState {
  isClockIn: boolean;
  lastClockIn: string | null;
  lastClockOut: string | null;
}

export default function StaffClockInOut() {
  const { data: session } = useSession();
  const [clockState, setClockState] = useState<ClockState>({
    isClockIn: false,
    lastClockIn: null,
    lastClockOut: null,
  });
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    // Load last clock state from localStorage
    const savedState = localStorage.getItem(`clockState-${session?.user?.email}`);
    if (savedState) {
      setClockState(JSON.parse(savedState));
    }

    return () => clearInterval(timer);
  }, [session]);

  const handleClockAction = () => {
    const now = new Date();
    const newState = {
      isClockIn: !clockState.isClockIn,
      lastClockIn: !clockState.isClockIn ? now.toISOString() : clockState.lastClockIn,
      lastClockOut: clockState.isClockIn ? now.toISOString() : clockState.lastClockOut,
    };

    setClockState(newState);
    localStorage.setItem(`clockState-${session?.user?.email}`, JSON.stringify(newState));

    // Here you would also make an API call to save the clock event
    // saveClockEvent(newState);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Clock In/Out</h2>
      
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-800 mb-2">
          {currentTime}
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <button
        onClick={handleClockAction}
        className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-colors ${
          clockState.isClockIn
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {clockState.isClockIn ? 'Clock Out' : 'Clock In'}
      </button>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-600">Last Clock In</div>
          <div className="font-medium">{formatTime(clockState.lastClockIn)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-gray-600">Last Clock Out</div>
          <div className="font-medium">{formatTime(clockState.lastClockOut)}</div>
        </div>
      </div>
    </div>
  );
} 