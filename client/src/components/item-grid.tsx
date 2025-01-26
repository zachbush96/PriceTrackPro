import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceChart } from './price-chart';
import { supabase } from '@/lib/supabase';
import type { Item } from '@/lib/supabase';

interface ItemGridProps {
  items: Item[];
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

        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{item.name}</span>
                <span className="text-primary">${Number(latestPrice).toFixed(2)}</span>
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
