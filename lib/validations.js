import { z } from 'zod';

// Schema for Product creation/update
export const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  sku: z.string().min(3, 'El SKU es obligatorio'),
  type: z.enum(['RAW', 'FINISHED']),
  purchaseCost: z.number().min(0, 'El costo no puede ser negativo'),
  salePrice: z.number().min(0, 'El precio no puede ser negativo'),
  minimumStock: z.number().min(0, 'El stock mínimo no puede ser negativo'),
});

// Schema for Inventory Movements
export const movementSchema = z.object({
  productId: z.number().int(),
  warehouseId: z.number().int(),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  type: z.enum(['ENTRY', 'EXIT', 'TRANSFER']),
  reason: z.string().optional(),
});

// Schema for Production Orders
export const productionSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().positive('Debe producir al menos una unidad'),
  warehouseId: z.number().int(),
  shiftId: z.number().int(),
  note: z.string().optional(),
});

// Schema for Sales/Invoices
export const saleSchema = z.object({
  customerName: z.string().min(2, 'El nombre del cliente es obligatorio'),
  items: z.array(z.object({
    productId: z.number().int(),
    quantity: z.number().positive(),
    price: z.number().min(0),
  })).min(1, 'Debe agregar al menos un producto'),
  paymentMethod: z.string(),
});
