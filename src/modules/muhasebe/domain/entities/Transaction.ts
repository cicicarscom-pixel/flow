export class Transaction {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _title: string;
  private readonly _amount: number;
  private readonly _date: string;
  private readonly _type?: string;
  private readonly _status?: string;
  private readonly _createdAt?: string;

  constructor(data: {
    id: string;
    name?: string;
    title?: string;
    amount: number;
    date: string;
    type?: string;
    status?: string;
    createdAt?: string;
  }) {
    this._id = data.id;
    this._name = data.name || data.title || '';
    this._title = data.title || data.name || '';
    this._amount = data.amount;
    this._date = data.date;
    this._type = data.type;
    this._status = data.status;
    this._createdAt = data.createdAt;
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get title(): string { return this._title; }
  get amount(): number { return this._amount; }
  get date(): string { return this._date; }
  get type(): string | undefined { return this._type; }
  get status(): string | undefined { return this._status; }
  get createdAt(): string | undefined { return this._createdAt; }
}
