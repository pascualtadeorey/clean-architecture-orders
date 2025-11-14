export class SKU {
  private readonly _value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SKU cannot be empty')
    }
    if (value.trim().length < 3) {
      throw new Error('SKU must be at least 3 characters long')
    }
    this._value = value.trim().toUpperCase()
  }

  get value(): string {
    return this._value
  }

  equals(other: SKU): boolean {
    return this._value === other._value
  }
}