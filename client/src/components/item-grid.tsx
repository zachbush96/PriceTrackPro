import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceChart } from './price-chart';
import { supabase } from '@/lib/supabase';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { Item } from '@/lib/supabase';
import { compareAsc, parseISO, subDays } from 'date-fns';

interface ItemGridProps {
  items: Item[];
}

interface PriceChange {
  percentage: number;
  increased: boolean;
}

function calculatePriceChange(prices: any[], daysAgo: number): PriceChange | null {
  if (!prices || prices.length < 2) return null;

  // Sort prices by date in ascending order
  const sortedPrices = [...prices].sort((a, b) => 
    compareAsc(parseISO(a.date), parseISO(b.date))
  );

  const latestDate = parseISO(sortedPrices[sortedPrices.length - 1].date);
  const compareDate = subDays(latestDate, daysAgo);

  // Get the latest price
  const currentPrice = Number(sortedPrices[sortedPrices.length - 1].price);

  // Find the closest price to our compare date
  let oldestPriceInPeriod = null;
  for (let i = 0; i < sortedPrices.length; i++) {
    const priceDate = parseISO(sortedPrices[i].date);
    if (priceDate >= compareDate) {
      oldestPriceInPeriod = Number(sortedPrices[i].price);
      break;
    }
  }

  // If we don't have an old enough price, try to use the oldest available
  if (!oldestPriceInPeriod) {
    oldestPriceInPeriod = Number(sortedPrices[0].price);
  }

  if (!oldestPriceInPeriod || oldestPriceInPeriod === 0) return null;

  const change = ((currentPrice - oldestPriceInPeriod) / oldestPriceInPeriod) * 100;
  return {
    percentage: Math.abs(Math.round(change * 10) / 10), // Round to 1 decimal place
    increased: change > 0
  };
}

function PriceChangeIndicator({ change }: { change: PriceChange | null }) {
  if (!change) return null;

  const Arrow = change.increased ? ArrowUp : ArrowDown;
  const color = change.increased ? 'text-green-500' : 'text-red-500';

  return (
    <span className={`inline-flex items-center ${color} text-xs font-medium`}>
      <Arrow className="h-3 w-3" />
      {change.percentage.toFixed(1)}%
    </span>
  );
}

export function ItemGrid({ items }: ItemGridProps) {
  const { data: priceData } = useQuery({
    queryKey: ['/api/prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .order('date');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const itemPrices = priceData?.filter((p) => p.item_id === item.id) || [];
        const latestPrice = itemPrices[itemPrices.length - 1]?.price || 0;

        const weekChange = calculatePriceChange(itemPrices, 7);
        const monthChange = calculatePriceChange(itemPrices, 30);
        const yearChange = calculatePriceChange(itemPrices, 365);

        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm space-x-2">
                    <span className="text-muted-foreground">
                      W: <PriceChangeIndicator change={weekChange} />
                    </span>
                    <span className="text-muted-foreground">
                      M: <PriceChangeIndicator change={monthChange} />
                    </span>
                    <span className="text-muted-foreground">
                      Y: <PriceChangeIndicator change={yearChange} />
                    </span>
                  </div>
                  <span className="text-primary text-lg font-medium">${Number(latestPrice).toFixed(2)}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart prices={itemPrices} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}