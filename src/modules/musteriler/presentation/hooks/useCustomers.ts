import { useState, useEffect } from 'react';
import { container } from '../../../../core/container';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repo = container.resolve('CustomerRepository') as ICustomerRepository;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await repo.getAll();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, error, refetch: fetchCustomers, repo };
}