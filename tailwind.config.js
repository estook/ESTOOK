/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tinta: {
          DEFAULT: '#111C1F',
          suave: '#3C4A4E',
          tenue: '#6B7A7E',
        },
        // El color de la marca del local. Se inyecta en tiempo de ejecución,
        // así que toda la app se pinta con el color que elija cada cliente.
        naranja: {
          DEFAULT: 'rgb(var(--marca) / <alpha-value>)',
          oscuro: 'rgb(var(--marca-oscuro) / <alpha-value>)',
          suave: 'rgb(var(--marca-suave) / <alpha-value>)',
        },
        lienzo: '#FFFFFF',
        panel: '#F5F7F7',
        borde: '#E2E7E7',
        ok: { DEFAULT: '#0F8A4F', suave: '#E7F5ED' },
        aviso: { DEFAULT: '#B87A00', suave: '#FDF3E0' },
        alerta: { DEFAULT: '#C8322A', suave: '#FBEAE9' },
      },
      fontFamily: {
        titulo: ['"Sora Variable"', 'Sora', 'system-ui', 'sans-serif'],
        texto: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        cifra: ['2.25rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        tarjeta: '0 1px 2px rgba(17,28,31,0.06), 0 1px 8px rgba(17,28,31,0.04)',
        hoja: '0 -8px 40px rgba(17,28,31,0.18)',
        flotante: '0 6px 24px rgba(255,122,0,0.35)',
      },
      spacing: { toque: '44px' },
      transitionTimingFunction: { estook: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      keyframes: {
        entrarAbajo: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        aparecer: { from: { opacity: '0' }, to: { opacity: '1' } },
        subirCorto: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        entrarAbajo: 'entrarAbajo 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        aparecer: 'aparecer 120ms ease-out',
        subirCorto: 'subirCorto 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
