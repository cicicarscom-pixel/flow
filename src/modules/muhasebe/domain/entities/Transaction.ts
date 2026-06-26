export class Transaction {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _amount: number;
  private readonly _date: string;
  private readonly _createdAt?: string;

  constructor(data: {
    id: string;
    name: string;
    amount: number;
    date: string;
    createdAt?: string;
  }) {
    this._id = data.id;
    this._name = data.name;
    this._amount = data.amount;
    this._date = data.date;
    this._createdAt = data.createdAt;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get amount(): number {
    return this._amount;
  }

  get date(): string {
    return this._date;
  }

  get createdAt(): string | undefined {
    return this._createdAt;
  }
}
