import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
			"./1779951755439490411.html"
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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
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
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
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
			fontFamily: {
				'mono': ['Roboto Mono', 'monospace'],
				'sans': ['Roboto', 'sans-serif'],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'card-swipe': {
					'0%': { transform: 'translateX(-120%) rotate(-5deg)', opacity: '0' },
					'30%': { transform: 'translateX(0%) rotate(0deg)', opacity: '1' },
					'70%': { transform: 'translateX(0%) rotate(0deg)', opacity: '1' },
					'100%': { transform: 'translateX(120%) rotate(5deg)', opacity: '0' },
				},
				'pulse-green': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
					'50%': { boxShadow: '0 0 0 20px rgba(34, 197, 94, 0)' },
				},
				'blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' },
				},
				'slide-up': {
					from: { transform: 'translateY(20px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' },
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%': { transform: 'translateX(-8px)' },
					'40%': { transform: 'translateX(8px)' },
					'60%': { transform: 'translateX(-8px)' },
					'80%': { transform: 'translateX(8px)' },
				},
				'processing': {
					'0%': { width: '0%' },
					'100%': { width: '100%' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'card-swipe': 'card-swipe 1.8s ease-in-out forwards',
				'pulse-green': 'pulse-green 1s ease-in-out infinite',
				'blink': 'blink 1s step-end infinite',
				'slide-up': 'slide-up 0.4s ease-out forwards',
				'shake': 'shake 0.4s ease-in-out',
				'processing': 'processing 2s ease-in-out forwards',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;