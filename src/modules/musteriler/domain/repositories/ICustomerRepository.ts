import { Customer } from '../entities/Customer';

export interface ICustomerRepository {
  getCustomers(): Promise<Customer[]>;
}
