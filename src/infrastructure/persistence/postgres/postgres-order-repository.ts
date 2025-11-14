import { Client, PoolClient } from 'pg';
import { createHash } from 'crypto';
import { OrderRepository } from '../../../application/ports/order-repository.js';
import { Order } from '../../../domain/entities/order.js';
import { SKU } from '../../../domain/value-objects/sku.js';
import { Money } from '../../../domain/value-objects/money.js';
import { Currency } from '../../../domain/value-objects/currency.js';
import { Quantity } from '../../../domain/value-objects/quantity.js';
import { Result, ok, fail } from '../../../shared/result.js';
import { AppError, InfraError, NotFoundError } from '../../../application/errors.js';

interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly client: Client | PoolClient) {}

  async save(order: Order): Promise<Result<void, AppError>> {
    const connection = await this.getConnection();
    
    try {
      // Calculate total amount and currency from order items
      const totals = order.getTotalByCurrency();
      const totalEntries = Array.from(totals.entries());
      
      // For simplicity, we'll use the first currency found
      // In a real scenario, you might want to handle multi-currency orders differently
      const totalMoney = totalEntries.length > 0 
        ? totalEntries[0][1] 
        : new Money(0, new Currency('EUR'));
      
      // Upsert order
      await this.upsertOrder(connection, order, totalMoney);
      
      // Delete existing order items and insert new ones
      await this.replaceOrderItems(connection, order);
      
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return fail(new InfraError(`Failed to save order: ${errorMessage}`));
    }
  }

  async findById(sku: SKU): Promise<Result<Order, AppError>> {
    try {
      // Find order by SKU using deterministic UUID
      const customerUuid = this.generateUuidFromSku(sku.value)
      const orderQuery = `
        SELECT id, customer_id, status, total_amount, currency, created_at, updated_at
        FROM orders 
        WHERE customer_id = $1
      `;
      
      const orderResult = await this.client.query<OrderRow>(orderQuery, [customerUuid]);
      
      if (orderResult.rows.length === 0) {
        return fail(new NotFoundError('Order', sku.value));
      }
      
      const orderRow = orderResult.rows[0];
      
      // Find order items
      const itemsQuery = `
        SELECT id, order_id, sku, quantity, unit_price, total_price, created_at
        FROM order_items 
        WHERE order_id = $1
        ORDER BY created_at ASC
      `;
      
      const itemsResult = await this.client.query<OrderItemRow>(itemsQuery, [orderRow.id]);
      
      // Reconstruct order using the original SKU
      const order = new Order(sku);
      
      for (const itemRow of itemsResult.rows) {
        const productSku = new SKU(itemRow.sku);
        const quantity = new Quantity(itemRow.quantity);
        const currency = new Currency(orderRow.currency);
        const unitPrice = new Money(itemRow.unit_price, currency);
        
        order.addItem(productSku, quantity, unitPrice);
      }
      
      // Clear events since this is a reconstructed order
      order.clearEvents();
      
      return ok(order);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return fail(new InfraError(`Failed to find order: ${errorMessage}`));
    }
  }

  private async getConnection(): Promise<PoolClient | Client> {
    // Always use the injected client (could be a transaction or regular client)
    return this.client;
  }

  private async upsertOrder(
    connection: PoolClient | Client, 
    order: Order, 
    totalMoney: Money
  ): Promise<void> {
    // Generate a UUID for customer_id based on the SKU for consistency
    const customerUuid = this.generateUuidFromSku(order.sku.value)
    
    const upsertQuery = `
      INSERT INTO orders (id, customer_id, status, total_amount, currency, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (customer_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        total_amount = EXCLUDED.total_amount,
        currency = EXCLUDED.currency,
        updated_at = NOW()
    `;
    
    await connection.query(upsertQuery, [
      customerUuid,
      'pending', // Default status
      totalMoney.amount,
      totalMoney.currency.code
    ]);
  }

  private async replaceOrderItems(
    connection: PoolClient | Client, 
    order: Order
  ): Promise<void> {
    // Get the order ID first using deterministic UUID
    const customerUuid = this.generateUuidFromSku(order.sku.value)
    const orderIdQuery = `
      SELECT id FROM orders WHERE customer_id = $1
    `;
    const orderIdResult = await connection.query(orderIdQuery, [customerUuid]);
    
    if (orderIdResult.rows.length === 0) {
      throw new Error('Order not found after upsert');
    }
    
    const orderId = orderIdResult.rows[0].id;
    
    // Delete existing items
    const deleteQuery = `
      DELETE FROM order_items WHERE order_id = $1
    `;
    await connection.query(deleteQuery, [orderId]);
    
    // Insert new items
    if (order.items.length > 0) {
      const insertQuery = `
        INSERT INTO order_items (id, order_id, sku, quantity, unit_price, total_price, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      `;
      
      for (const item of order.items) {
        await connection.query(insertQuery, [
          orderId,
          item.productSku.value,
          item.quantity.value,
          item.unitPrice.amount,
          item.totalPrice.amount
        ]);
      }
    }
  }

  private generateUuidFromSku(sku: string): string {
    // Create a deterministic UUID based on SKU using hash
    const hash = createHash('sha256').update(sku).digest('hex');
    // Format as UUID v4
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // Version 4
      '8' + hash.substring(17, 20), // Variant bits
      hash.substring(20, 32)
    ].join('-');
  }
}
