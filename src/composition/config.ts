import { z } from 'zod';
import 'dotenv/config';

// Schema de validación para las variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(65535)).default('3000'),
  
  // Database configuration
  DATABASE_TYPE: z.enum(['memory', 'postgres']).default('memory'),
  DATABASE_URL: z.string().url().optional(),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
  
  // Optional configurations
  OUTBOX_WORKER_INTERVAL_MS: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(100)).default('1000'),
}).refine((data) => {
  // If DATABASE_TYPE is postgres, DATABASE_URL is required
  if (data.DATABASE_TYPE === 'postgres' && !data.DATABASE_URL) {
    return false;
  }
  return true;
}, {
  message: "DATABASE_URL is required when DATABASE_TYPE is 'postgres'",
  path: ["DATABASE_URL"],
});

// Tipo derivado del schema
export type Config = z.infer<typeof envSchema>;

// Función para validar y obtener la configuración
function validateConfig(): Config {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      console.error('❌ Invalid environment configuration:');
      errorMessages.forEach(msg => console.error(`  - ${msg}`));
      
      process.exit(1);
    }
    
    throw error;
  }
}

// Exportar la configuración validada
export const config = validateConfig();

// Función helper para obtener la URL de conexión a la base de datos
export function getDatabaseUrl(cfg: Config = config): string {
  if (!cfg.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }
  return cfg.DATABASE_URL;
}

// Función helper para verificar si estamos en desarrollo
export function isDevelopment(cfg: Config = config): boolean {
  return cfg.NODE_ENV === 'development';
}

// Función helper para verificar si estamos en producción
export function isProduction(cfg: Config = config): boolean {
  return cfg.NODE_ENV === 'production';
}

// Función helper para verificar si estamos en test
export function isTest(cfg: Config = config): boolean {
  return cfg.NODE_ENV === 'test';
}

// Función helper para verificar si usamos base de datos en memoria
export function useInMemoryDatabase(cfg: Config = config): boolean {
  return cfg.DATABASE_TYPE === 'memory';
}

// Función helper para verificar si usamos PostgreSQL
export function usePostgresDatabase(cfg: Config = config): boolean {
  return cfg.DATABASE_TYPE === 'postgres';
}
