export class Quantity {
  private readonly _value: number

  constructor(value: number) {
    if (value <= 0) {
      throw new Error('Quantity must be greater than zero')
    }
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be a whole number')
    }
    this._value = value
  }

  get value(): number {
    return this._value
  }

  add(other: Quantity): Quantity {
    return new Quantity(this._value + other._value)
  }

  equals(other: Quantity): boolean {
    return this._value === other._value
  }
}