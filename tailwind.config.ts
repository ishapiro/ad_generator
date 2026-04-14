import type { Config } from 'tailwindcss'
import tailwindTypography from '@tailwindcss/typography'

export default {
  content: ['./components/**/*.vue', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        reading: ['"Source Sans 3"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      maxWidth: {
        reading: '65ch',
        'reading-wide': '96ch',
        content: '48rem',
        wide: '64rem',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typography: (theme: (key: string) => any) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.sans').join(','),
            color: theme('colors.slate.800'),
            maxWidth: '65ch',
            lineHeight: '1.6',
            'h1, h2, h3, h4': {
              fontFamily: theme('fontFamily.sans').join(','),
              color: theme('colors.slate.900'),
              fontWeight: '700',
              letterSpacing: '-0.01em',
            },
            h1: {
              fontSize: '2.5rem',
            },
            h2: {
              fontSize: '1.5rem',
              marginTop: '1.75em',
              marginBottom: '0.75em',
            },
            h3: {
              fontSize: '1.25rem',
              marginTop: '1.4em',
              marginBottom: '0.6em',
            },
            p: {
              marginTop: '0.8em',
              marginBottom: '0.8em',
            },
            li: {
              marginTop: '0.3em',
              marginBottom: '0.3em',
            },
            a: {
              color: theme('colors.blue.600'),
              textDecoration: 'underline',
              textDecorationThickness: '0.08em',
              textUnderlineOffset: '0.18em',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
            code: {
              fontSize: '0.95em',
              backgroundColor: theme('colors.slate.100'),
              padding: '0.15em 0.25em',
              borderRadius: theme('borderRadius.sm'),
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: 0,
              borderRadius: 0,
            },
            blockquote: {
              fontStyle: 'normal',
              color: theme('colors.slate.700'),
              borderLeftColor: theme('colors.blue.400'),
            },
          },
        },
        lg: {
          css: {
            fontSize: '1rem',
            lineHeight: '1.6',
          },
        },
      }),
    },
  },
  plugins: [tailwindTypography],
} satisfies Config
