import { useState } from 'react';
import { useAccountStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Upload, AlertCircle } from 'lucide-react';
import { PinData } from '@/types/pinterest';
import { toast } from 'sonner';
import Papa from 'papaparse';

export function SchedulePins() {
  const { selectedAccountId, boards, accounts } = useAccountStore();
  const [pins, setPins] = useState<PinData[]>([]);
  const [pinsPerDay, setPinsPerDay] = useState(10);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedPins = results.data.slice(1).map((row: any) => ({
          title: row[0],
          description: row[1],
          link: row[2],
          imageUrl: row[3],
        }));
        setPins(parsedPins);
        toast.success(`Successfully loaded ${parsedPins.length} pins`);
      },
      header: true,
      error: (error) => {
        toast.error('Error parsing CSV file: ' + error.message);
      },
    });
  };

  const generateSchedule = async () => {
    if (!selectedAccountId || !pins.length) {
      toast.error('Please select an account and upload pins');
      return;
    }

    const accountBoards = boards[selectedAccountId] || [];
    if (!accountBoards.length) {
      toast.error('No boards available for selected account');
      return;
    }

    setIsScheduling(true);
    try {
      // Calculate time slots
      const now = new Date();
      const scheduledPins = pins.map((pin, index) => {
        const minutesOffset = (index % pinsPerDay) * 10; // 10 minutes between pins
        const daysOffset = Math.floor(index / pinsPerDay);
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + daysOffset);
        scheduleDate.setMinutes(scheduleDate.getMinutes() + minutesOffset);

        // Randomly select a board
        const randomBoard = accountBoards[Math.floor(Math.random() * accountBoards.length)];

        return {
          ...pin,
          id: crypto.randomUUID(),
          boardId: randomBoard.id,
          scheduledTime: scheduleDate.toISOString(),
          status: 'scheduled' as const,
        };
      });

      // Store scheduled pins (you'll need to implement this)
      // await storeScheduledPins(scheduledPins);

      toast.success('Pins scheduled successfully!');
    } catch (error) {
      toast.error('Failed to schedule pins');
      console.error('Scheduling error:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  if (!selectedAccountId) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No Account Selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a Pinterest account first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Schedule Pins</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  CSV with columns: title, description, link, imageUrl
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pins per Day
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={pinsPerDay}
              onChange={(e) => setPinsPerDay(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
          </div>

          {pins.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={generateSchedule}
                disabled={isScheduling}
                className="w-full"
              >
                {isScheduling ? 'Scheduling...' : 'Schedule Now'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {pins.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Uploaded Pins ({pins.length})</h3>
          </div>
          <div className="divide-y">
            {pins.slice(0, 5).map((pin, index) => (
              <div key={index} className="p-6 flex items-center space-x-4">
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium">{pin.title}</h4>
                  <p className="text-sm text-gray-500">{pin.description}</p>
                </div>
              </div>
            ))}
            {pins.length > 5 && (
              <div className="p-4 text-center text-gray-500">
                And {pins.length - 5} more pins...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}