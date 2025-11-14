export class Currency {
  private static readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'MXN']
  private readonly _code: string

  constructor(code: string) {
    if (!code || !Currency.VALID_CURRENCIES.includes(code.toUpperCase())) {
      throw new Error(`Invalid currency code: ${code}. Valid currencies: ${Currency.VALID_CURRENCIES.join(', ')}`)
    }
    this._code = code.toUpperCase()
  }

  get code(): string {
    return this._code
  }

  equals(other: Currency): boolean {
    return this._code === other._code
  }
}