import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ItemGrid } from '@/components/item-grid';
import { AddPriceForm } from '@/components/add-price-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const subscription = supabase
      .channel('price-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'prices'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Price Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <AddPriceForm items={items || []} />
          </CardContent>
        </Card>

        <ItemGrid items={items || []} />
      </div>
    </div>
  );
}
