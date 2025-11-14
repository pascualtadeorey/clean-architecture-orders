import { Currency } from './currency.js'

export class Money {
  private readonly _amount: number
  private readonly _currency: Currency

  constructor(amount: number, currency: Currency) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number')
    }
    this._amount = Math.round(amount * 100) / 100 // Round to 2 decimal places
    this._currency = currency
  }

  get amount(): number {
    return this._amount
  }

  get currency(): Currency {
    return this._currency
  }

  add(other: Money): Money {
    if (!this._currency.equals(other._currency)) {
      throw new Error('Cannot add money with different currencies')
    }
    return new Money(this._amount + other._amount, this._currency)
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative')
    }
    return new Money(this._amount * factor, this._currency)
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency.equals(other._currency)
  }
}