import { QueryClient } from '@tanstack/react-query'

/**
 * Capa de datos. Con red floja se reintenta poco y se sirve lo último conocido:
 * en una cocina es mejor un número de hace un minuto que una pantalla en blanco.
 */
export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (intentos, error) => navigator.onLine && intentos < 2 && !(error instanceof TypeError),
      refetchOnWindowFocus: true,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'offlineFirst' },
  },
})
