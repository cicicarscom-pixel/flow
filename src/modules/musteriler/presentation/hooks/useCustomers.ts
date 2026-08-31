import { useState, useEffect } from 'react';
import { container } from '../../../../core/container';
import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const repo = container.resolve('CustomerRepository') as ICustomerRepository;
      const data = await repo.getCustomers();
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

  return { customers, loading, error, refetch: fetchCustomers };
}
