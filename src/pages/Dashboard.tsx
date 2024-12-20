// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { fetchScheduledPins } from '@/lib/api';
import type { ScheduledPin } from '@/types/pinterest';

// Make sure the export matches exactly what's being imported
export function Dashboard() {
  const [pins, setPins] = useState<ScheduledPin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPins = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const idToken = await currentUser.getIdToken();
      const result = await fetchScheduledPins(idToken);
      setPins(result.pins);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPins();
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div>
            {pins.map((pin) => (
              <div key={pin.id}>
                {/* Pin display component */}
                <h3>{pin.title}</h3>
                <p>{pin.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
