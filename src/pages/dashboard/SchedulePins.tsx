import { useState } from 'react';
import { useAccountStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { AccountSelector } from '@/components/schedule/AccountSelector';
import { FileUploader } from '@/components/schedule/FileUploader';
import { schedulePin } from '@/lib/pinterest';
import type { PinData, ScheduledPin } from '@/types/pinterest';
import { toast } from 'sonner';

export function SchedulePins() {
  const { selectedAccountId, boards } = useAccountStore();
  const [pins, setPins] = useState<PinData[]>([]);
  const [pinsPerDay, setPinsPerDay] = useState(10);
  const [isScheduling, setIsScheduling] = useState(false);

  const handlePinsLoaded = (loadedPins: PinData[]) => {
    if (loadedPins.length === 0) {
      toast.error('No pins uploaded. Please upload valid pins.');
      return;
    }
    setPins(loadedPins);
    toast.success(`${loadedPins.length} pins loaded successfully!`);
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
      const now = new Date();
      const scheduledPins: ScheduledPin[] = pins.map((pin, index) => {
        const minutesOffset = (index % pinsPerDay) * (24 * 60 / pinsPerDay);
        const daysOffset = Math.floor(index / pinsPerDay);
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + daysOffset);
        scheduleDate.setMinutes(scheduleDate.getMinutes() + minutesOffset);

        const randomBoard = accountBoards[Math.floor(Math.random() * accountBoards.length)];

        return {
          ...pin,
          id: crypto.randomUUID(),
          boardId: randomBoard.id,
          accountId: selectedAccountId,
          scheduledTime: scheduleDate.toISOString(),
          status: 'scheduled',
        };
      });

      for (const pin of scheduledPins) {
        await schedulePin(pin);
      }

      setPins([]);
      toast.success(`S
