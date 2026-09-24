export class Calendar {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _isActive: boolean;
  private readonly _createdAt: string;
  private readonly _updatedAt: string;

  constructor(data: { id: string; name: string; isActive?: boolean; createdAt?: string; updatedAt?: string }) {
    this._id = data.id;
    this._name = data.name;
    this._isActive = data.isActive !== undefined ? data.isActive : true;
    this._createdAt = data.createdAt || new Date().toISOString();
    this._updatedAt = data.updatedAt || new Date().toISOString();
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
}

