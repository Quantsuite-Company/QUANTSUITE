import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				'serif': ['Instrument Serif', 'Georgia', 'Times New Roman', 'serif'],
				'mono': ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glow: 'hsl(var(--accent-glow))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				profit: 'hsl(var(--profit))',
				loss: 'hsl(var(--loss))',
				'terminal-bg': 'hsl(var(--terminal-bg))',
				'terminal-panel': 'hsl(var(--terminal-panel))',
				'terminal-highlight': 'hsl(var(--terminal-highlight))',
				'terminal-accent': 'hsl(var(--terminal-accent))',
				'terminal-success': 'hsl(var(--terminal-success))',
				'param-stock': 'hsl(var(--param-stock))',
				'param-strike': 'hsl(var(--param-strike))',
				'param-time': 'hsl(var(--param-time))',
				'param-volatility': 'hsl(var(--param-volatility))',
				'param-rate': 'hsl(var(--param-rate))',
				'param-dividend': 'hsl(var(--param-dividend))',
				
				// Terminal Chart Colors
				'chart-bg': 'hsl(var(--chart-bg))',
				'chart-grid': 'hsl(var(--chart-grid))',
				'chart-axis': 'hsl(var(--chart-axis))',
				'trading-profit': 'hsl(var(--trading-profit))',
				'trading-profit-light': 'hsl(var(--trading-profit-light))',
				'trading-loss': 'hsl(var(--trading-loss))',
				'trading-loss-light': 'hsl(var(--trading-loss-light))',
				'trading-neutral': 'hsl(var(--trading-neutral))',
				
				// QuantSuite Brand Colors
        'qs-brand': {
          50: 'hsl(var(--qs-brand-50))',
          100: 'hsl(var(--qs-brand-100))',
          200: 'hsl(var(--qs-brand-200))',
          300: 'hsl(var(--qs-brand-300))',
          400: 'hsl(var(--qs-brand-400))',
          500: 'hsl(var(--qs-brand-500))',
          600: 'hsl(var(--qs-brand-600))',
          700: 'hsl(var(--qs-brand-700))',
          800: 'hsl(var(--qs-brand-800))',
          900: 'hsl(var(--qs-brand-900))',
        },
        
        // Trading Semantics
        'qs-profit': 'hsl(var(--qs-profit))',
        'qs-profit-light': 'hsl(var(--qs-profit-light))',
        'qs-loss': 'hsl(var(--qs-loss))',
        'qs-loss-light': 'hsl(var(--qs-loss-light))',
        'qs-neutral': 'hsl(var(--qs-neutral))',
        
        // Market Status
        'qs-market-open': 'hsl(var(--qs-market-open))',
        'qs-market-closed': 'hsl(var(--qs-market-closed))',
        'qs-market-pre': 'hsl(var(--qs-market-pre))',
        'qs-market-post': 'hsl(var(--qs-market-post))',
				
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			boxShadow: {
				'chart-glow': '0 0 30px hsl(var(--glow-cyan) / 0.15)',
				'profit-glow': '0 0 20px hsl(var(--glow-green) / 0.3)',
				'loss-glow': '0 0 20px hsl(var(--glow-red) / 0.3)',
				'terminal': '0 4px 20px -4px hsl(var(--primary) / 0.3)',
				'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
