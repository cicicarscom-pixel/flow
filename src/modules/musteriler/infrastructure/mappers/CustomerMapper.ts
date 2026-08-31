import { Customer } from '../../domain/entities/Customer';

export class CustomerMapper {
  static toDomain(raw: any): Customer {
    return new Customer({
      id: raw.id,
      organizationId: raw.organization_id,
      phone: raw.phone,
      name: raw.name,
      notes: raw.notes,
      createdAt: raw.created_at,
    });
  }
}
