
import { Logo } from './Logo'
import { animate } from 'animejs'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { ThemeToggle } from './ThemeToggle'
import { useDemo } from '../contexts/DemoContext'
import { PageWrapper } from './PageWrapper'
import { PWAInstallGuide } from './PWAInstallGuide'
import { AuthModal } from './landing'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { X, Users, Coins, Trophy, CalendarCheck, ShieldCheck, Sparkle, Star, CaretRight, CheckCircle } from '@phosphor-icons/react'
import { motion, useInView } from 'framer-motion'

// Scroll animation variants - using 'as const' for proper type inference
const smoothEase = [0.22, 1, 0.36, 1] as const

const fadeInUp = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: smoothEase }
	}
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1
		}
	}
}

const staggerItem = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: smoothEase }
	}
}

// Reusable scroll animation wrapper
const ScrollReveal = ({ children, className = '', variants = fadeInUp, ...props }: {
	children: React.ReactNode
	className?: string
	variants?: typeof fadeInUp
	[key: string]: unknown
}) => {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={isInView ? 'visible' : 'hidden'}
			variants={variants}
			className={className}
			{...props}
		>
			{children}
		</motion.div>
	)
}

const features = [
	{ icon: Users, title: 'Multi-user households', text: 'Parent, teen, kid roles with fine-grained permissions and parent approval for redemptions.' },
	{ icon: Coins, title: 'Points -> Rewards', text: 'XP, streaks, and cash-outs that keep momentum. Parents approve kids\' redemptions.' },
	{ icon: Trophy, title: 'Leaderboards', text: 'Weekly and all-time standings drive friendly competition.' },
	{ icon: CalendarCheck, title: 'Schedules & Routines', text: 'Recurring tasks, reminders, and auto-rotations.' },
	{ icon: ShieldCheck, title: 'Progress & Safety', text: 'Audit logs, parent approvals, and role-based controls.' },
	{ icon: Sparkle, title: 'Customization', text: 'Themes, avatars, and profile perks as you level up.' },
]

export default function LandingPage() {
	const { enterDemoMode } = useDemo()
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [showInstallGuide, setShowInstallGuide] = useState(false)
	const [showVideoModal, setShowVideoModal] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)
	const heroRef = useRef<HTMLDivElement>(null)
	const featuresRef = useRef<HTMLDivElement>(null)
	const installGuideBackdropRef = useRef<HTMLDivElement>(null)
	const installGuideModalRef = useRef<HTMLDivElement>(null)
	const videoBackdropRef = useRef<HTMLDivElement>(null)
	const videoModalRef = useRef<HTMLDivElement>(null)

	// Fetch public global leaderboard
	const globalLeaderboard = useQuery(api.stats.getPublicGlobalLeaderboard, { limit: 5 })

	// Animate hero section on mount
	useEffect(() => {
		if (heroRef.current) {
			animate(heroRef.current, {
				opacity: [0, 1],
				translateY: [16, 0],
				duration: 500,
				ease: 'outQuart',
			})
		}
	}, [])

	// Feature cards are now animated by framer-motion stagger

	// Animate install guide modal
	useEffect(() => {
		if (showInstallGuide) {
			if (installGuideBackdropRef.current) {
				animate(installGuideBackdropRef.current, {
					opacity: [0, 1],
					duration: 200,
					ease: 'outQuart',
				})
			}
			if (installGuideModalRef.current) {
				animate(installGuideModalRef.current, {
					opacity: [0, 1],
					scale: [0.95, 1],
					translateY: [20, 0],
					duration: 300,
					ease: 'outQuart',
				})
			}
		}
	}, [showInstallGuide])

	// Animate video modal
	useEffect(() => {
		if (showVideoModal) {
			if (videoBackdropRef.current) {
				// Set opacity immediately as fallback, then animate
				videoBackdropRef.current.style.opacity = '1'
				animate(videoBackdropRef.current, {
					opacity: [0, 1],
					duration: 200,
					ease: 'outQuart',
				})
			}
			if (videoModalRef.current) {
				// Set opacity immediately as fallback, then animate
				videoModalRef.current.style.opacity = '1'
				videoModalRef.current.style.transform = 'none'
				animate(videoModalRef.current, {
					opacity: [0, 1],
					duration: 300,
					ease: 'outQuart',
				})
			}
		}
	}, [showVideoModal])

	// Check for hash on mount and when it changes
	useEffect(() => {
		const checkHash = () => {
			if (window.location.hash === '#signin') {
				setShowAuthModal(true)
			}
		}
		checkHash()
		window.addEventListener('hashchange', checkHash)
		return () => window.removeEventListener('hashchange', checkHash)
	}, [])

	const openAuthModal = () => {
		setShowAuthModal(true)
		window.location.hash = '#signin'
	}

	const closeAuthModal = () => {
		setShowAuthModal(false)
		if (window.location.hash === '#signin') {
			window.history.replaceState(null, '', window.location.pathname)
		}
	}

	const openVideoModal = () => {
		setShowVideoModal(true)
	}

	const closeVideoModal = () => {
		setShowVideoModal(false)
	}

	// Handle escape key and body scroll lock for video modal
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && showVideoModal) {
				closeVideoModal()
			}
		}

		if (showVideoModal) {
			document.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = ''
		}
	}, [showVideoModal])

	// Animated background GIF from Giphy
	const backgroundGifUrl = '/background.gif'

	// Background beat
	const backgroundAudioUrl = '/sounds/mrsty.mp3'

	return (
		<PageWrapper
			showBackground={true}
			backgroundImage={backgroundGifUrl}
			backgroundOpacity={0.2}
			backgroundAudio={backgroundAudioUrl}
			audioVolume={0.04}
		>
			{/* Header - Radiant Momentum */}
			<header className="sticky top-0 z-40 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-amber-500/10">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-3 sm:py-5">
					<div className="flex items-center gap-2 sm:gap-4">
						<div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl radiant-icon text-white shadow-lg">
							<Logo className="h-6 w-6 sm:h-10 sm:w-10" />
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
							<span className="text-sm sm:text-xl font-brand font-bold tracking-tight radiant-text">DAILY BAG</span>
							<Badge className="w-fit mt-0.5 sm:mt-0 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 text-[10px] sm:text-xs font-medium px-1.5 py-0">Beta</Badge>
						</div>
					</div>
					<nav className="hidden items-center gap-6 lg:gap-8 md:flex">
						<a href="#features" className="text-sm text-muted-foreground hover:text-amber-400 transition-colors duration-300">Features</a>
						<button
							onClick={enterDemoMode}
							className="text-sm text-muted-foreground hover:text-amber-400 transition-colors duration-300 bg-transparent border-none cursor-pointer"
						>
							Demo
						</button>
						<a href="#pricing" className="text-sm text-muted-foreground hover:text-amber-400 transition-colors duration-300">Pricing</a>
						<a href="#faq" className="text-sm text-muted-foreground hover:text-amber-400 transition-colors duration-300">FAQ</a>
					</nav>
					<div className="flex items-center gap-2 sm:gap-4">
						<ThemeToggle />
						<Button className="radiant-button rounded-xl h-9 sm:h-10 px-3 sm:px-5 text-sm" size="sm" onClick={openAuthModal}>
							Sign in
						</Button>
					</div>
				</div>
			</header>

			{/* Hero Section - Radiant Momentum */}
			<section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24 pt-20 sm:pt-28 md:pb-32 md:pt-36 lg:pt-40 radiant-hero-glow">
				<div
					ref={heroRef}
					className="mx-auto max-w-4xl text-center"
					style={{ opacity: 0 }}
				>
					<div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs text-amber-400 ring-1 ring-amber-500/30 backdrop-blur-sm">
						<Star className="h-3.5 w-3.5 text-amber-400" />
						Turn chores into XP and real rewards
					</div>
					<h1 className="mt-8 sm:mt-10 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight leading-[1.1]">
						<span className="block sm:inline">Get to the bag</span>
						<br className="hidden sm:block" />
						<span className="radiant-text-animated block sm:inline">one chore at a time</span>
					</h1>
					<p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg text-muted-foreground font-body leading-relaxed">
						Turn your to-do list into a leaderboard. Earn points, unlock achievements, and make household chores feel like winning.
					</p>
					<div className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button
							onClick={enterDemoMode}
							className="radiant-button h-12 px-8 text-base rounded-xl w-full sm:w-auto"
						>
							Try the demo <CaretRight className="ml-2 h-5 w-5" />
						</Button>
						<Button
							variant="outline"
							className="border-amber-500/30 bg-card/40 hover:bg-amber-500/10 hover:border-amber-500/50 h-12 px-8 text-base rounded-xl w-full sm:w-auto transition-all duration-300"
							onClick={openVideoModal}
						>
							Watch overview
						</Button>
					</div>
					<div className="mt-8 sm:mt-10 text-sm text-muted-foreground">
						Trusted by busy parents and motivated kids in <span className="text-amber-400 font-medium">1,000+</span> homes
					</div>
				</div>
			</section>

			{/* Radiant Divider */}
			<div className="radiant-divider mx-auto max-w-3xl" />

			{/* Features Section - Radiant Momentum */}
			<section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
				<ScrollReveal className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
						Everything you need to <span className="radiant-text">win at home</span>
					</h2>
					<p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
						Built for families who want to turn daily routines into rewarding experiences.
					</p>
				</ScrollReveal>
				<motion.div
					ref={featuresRef}
					className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: '-50px' }}
					variants={staggerContainer}
				>
					{features.map((f) => (
						<motion.div key={f.title} variants={staggerItem}>
							<Card className="feature-card h-full radiant-card rounded-2xl backdrop-blur-sm">
								<CardHeader className="flex flex-row items-center gap-4 pb-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl radiant-icon text-white">
										<f.icon className="h-6 w-6" />
									</div>
									<h3 className="text-lg font-heading font-semibold">{f.title}</h3>
								</CardHeader>
								<CardContent className="pt-0 text-muted-foreground font-body leading-relaxed">{f.text}</CardContent>
							</Card>
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* Radiant Divider */}
			<div className="radiant-divider mx-auto max-w-3xl" />

			{/* Live Demo Section - Radiant Momentum */}
			<section id="demo" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
				<motion.div
					className="grid items-start gap-8 lg:grid-cols-2"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: '-50px' }}
					variants={staggerContainer}
				>
					<motion.div variants={staggerItem}>
					<Card className="radiant-card rounded-2xl backdrop-blur-sm radiant-glow">
						<CardHeader>
							<div className="flex items-center justify-between">
								<h3 className="text-xl font-heading font-semibold">Global Leaderboard</h3>
								<Badge className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 animate-pulse">Live</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{globalLeaderboard === undefined ? (
								<div className="space-y-3">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3 animate-pulse">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-full bg-amber-500/20" />
												<div className="space-y-2">
													<div className="h-4 w-24 rounded bg-amber-500/20" />
													<div className="h-3 w-32 rounded bg-amber-500/10" />
												</div>
											</div>
											<div className="h-5 w-16 rounded bg-amber-500/20" />
										</div>
									))}
								</div>
							) : globalLeaderboard && globalLeaderboard.length > 0 ? (
								globalLeaderboard.map((household, idx) => {
									const rankIcon = idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : `${idx + 1}`
									const avgLevel = household.members && household.members.length > 0
										? Math.round(household.members.reduce((sum: number, m: { level?: number }) => sum + (m.level || 1), 0) / household.members.length)
										: 1
									return (
										<div key={household.householdId} className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3 transition-all duration-300 hover:bg-amber-500/10 hover:border-amber-500/20">
											<div className="flex items-center gap-3">
												<div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${idx === 0 ? 'radiant-icon text-white' : 'bg-amber-500/20 text-amber-400'}`}>
													{rankIcon}
												</div>
												<div>
													<div className="font-medium">{household.householdName}</div>
													<div className="text-xs text-muted-foreground">
														{household.memberCount} {household.memberCount === 1 ? 'member' : 'members'} · Avg Lv {avgLevel}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Coins className="h-4 w-4 text-amber-400" />
												<span className="font-semibold radiant-text">{household.totalPoints.toLocaleString()}</span>
											</div>
										</div>
									)
								})
							) : (
								<div className="text-center py-8 text-muted-foreground">
									<Trophy className="h-8 w-8 mx-auto mb-2 opacity-50 text-amber-500" />
									<p>No households yet. Be the first to join!</p>
								</div>
							)}
						</CardContent>
						<CardFooter className="justify-between border-t border-amber-500/10 pt-4">
							<div className="text-xs text-muted-foreground">Top households by total points earned.</div>
							<Button
								variant="outline"
								className="border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300"
								onClick={openAuthModal}
							>
								Join the competition
							</Button>
						</CardFooter>
					</Card>
					</motion.div>

					<motion.div variants={staggerItem}>
					<Card className="radiant-card rounded-2xl backdrop-blur-sm">
						<CardHeader>
							<h3 className="text-xl font-heading font-semibold">Get early access</h3>
							<p className="text-sm text-muted-foreground">Join the beta and receive setup templates for families and shared houses.</p>
						</CardHeader>
						<CardContent>
							<form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
								<Input type="email" placeholder="you@example.com" className="bg-background/60 border-amber-500/20 focus:border-amber-500/50 rounded-xl" />
								<Button className="radiant-button rounded-xl">Request invite</Button>
							</form>
							<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
								<CheckCircle className="h-4 w-4 text-amber-500" /> No spam. Unsubscribe anytime.
							</div>
						</CardContent>
					</Card>
					</motion.div>
				</motion.div>
			</section>

			{/* How It Works - Radiant Momentum */}
			<section className="mx-auto max-w-7xl px-6 py-20 sm:py-28 radiant-bg-accent">
				<ScrollReveal className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
						Three steps to <span className="radiant-text">transform your home</span>
					</h2>
				</ScrollReveal>
				<motion.div
					className="grid gap-8 md:grid-cols-3"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: '-50px' }}
					variants={staggerContainer}
				>
					{[
						{ step: '1', title: 'Create your home', text: 'Invite family members and set roles. Import or pick starter chores.' },
						{ step: '2', title: 'Assign XP & rewards', text: 'Choose values, add streaks, and set cash-out rules.' },
						{ step: '3', title: 'Play to progress', text: 'Complete tasks, climb the board, unlock perks, repeat.' },
					].map((s) => (
						<motion.div key={s.step} variants={staggerItem}>
							<Card className="radiant-card rounded-2xl backdrop-blur-sm text-center h-full">
								<CardHeader className="pb-3">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl radiant-icon text-white font-bold text-xl mx-auto">{s.step}</div>
									<h3 className="mt-4 text-xl font-heading font-semibold">{s.title}</h3>
								</CardHeader>
								<CardContent className="pt-0 text-muted-foreground leading-relaxed">{s.text}</CardContent>
							</Card>
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* Radiant Divider */}
			<div className="radiant-divider mx-auto max-w-3xl" />

			{/* Pricing Section - Radiant Momentum */}
			<section id="pricing" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
				<ScrollReveal className="mb-12 sm:mb-16 text-center">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
						Simple <span className="radiant-text">pricing</span>
					</h2>
					<p className="mt-4 text-muted-foreground max-w-xl mx-auto">Start free. Upgrade for advanced automation and more users.</p>
				</ScrollReveal>
				<motion.div
					className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: '-50px' }}
					variants={staggerContainer}
				>
					<motion.div variants={staggerItem}>
					<Card className="radiant-card rounded-2xl backdrop-blur-sm h-full group hover:scale-[1.02] transition-transform duration-300">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<h3 className="text-xl font-heading font-semibold">Free</h3>
								<Badge className="bg-secondary text-secondary-foreground">Get started</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<span className="text-4xl font-extrabold">$0</span>
								<p className="text-sm text-muted-foreground mt-1">Forever free</p>
							</div>
							<ul className="space-y-3 text-sm text-muted-foreground">
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" /> Up to 10 chores</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" /> Up to 4 household members</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" /> Basic rewards & leaderboard</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" /> Level progression</li>
							</ul>
						</CardContent>
						<CardFooter>
							<Button onClick={openAuthModal} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12 rounded-xl text-base transition-all duration-300">Get started</Button>
						</CardFooter>
					</Card>
					</motion.div>

					<motion.div variants={staggerItem}>
					<Card className="radiant-card rounded-2xl backdrop-blur-sm radiant-glow-intense radiant-border overflow-hidden h-full relative group hover:scale-[1.02] transition-transform duration-300">
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<h3 className="text-xl font-heading font-semibold">Premium</h3>
								<Badge className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 shadow-lg shadow-amber-500/20">Most Popular</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<span className="text-4xl font-extrabold radiant-text">$4.99</span>
								<span className="text-base font-normal text-muted-foreground"> / month</span>
								<p className="text-sm text-muted-foreground mt-1">per household</p>
							</div>
							<p className="text-sm text-amber-400 font-medium">or $39.99/year (save 33%)</p>
							<ul className="space-y-3 text-sm text-muted-foreground">
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" weight="fill" /> Unlimited chores & members</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" weight="fill" /> Custom rewards</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" weight="fill" /> Photo verification</li>
								<li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500 shrink-0" weight="fill" /> Advanced analytics & exports</li>
							</ul>
						</CardContent>
						<CardFooter>
							<Button onClick={openAuthModal} className="w-full radiant-button h-12 rounded-xl text-base">Start free trial</Button>
						</CardFooter>
					</Card>
					</motion.div>
				</motion.div>
			</section>

			{/* Radiant Divider */}
			<div className="radiant-divider mx-auto max-w-3xl" />

			{/* FAQ Section - Radiant Momentum */}
			<section id="faq" className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
				<ScrollReveal className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
						Frequently asked <span className="radiant-text">questions</span>
					</h2>
				</ScrollReveal>
				<motion.div
					className="space-y-4"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: '-50px' }}
					variants={staggerContainer}
				>
					{[
						{ q: 'How do points convert to money?', a: 'You set a conversion rate per home. Example: 10 points = $1. Parents approve kids\' cash-outs.' },
						{ q: 'Can I use it with roommates?', a: 'Yes. Roles and rewards are fully customizable for families or shared houses.' },
						{ q: 'Is there parental control?', a: 'Parents approve redemptions, edit XP values, and review audit logs. Teens and kids require approval.' },
						{ q: 'Will there be iOS and Android apps?', a: 'Yes. Web first, native apps follow shortly after beta.' },
						{ q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption and never share your data with third parties. All data is stored securely in the cloud.' },
					].map((item) => (
						<motion.details key={item.q} variants={staggerItem} className="group radiant-card rounded-2xl px-6 py-4 transition-all duration-300 hover:border-amber-500/30 open:border-amber-500/40 open:shadow-lg open:shadow-amber-500/5">
							<summary className="cursor-pointer list-none py-2 text-lg font-medium outline-none flex items-center justify-between gap-4">
								<span className="text-foreground group-open:radiant-text transition-all duration-300 text-left">{item.q}</span>
								<CaretRight className="h-5 w-5 text-amber-500 transition-transform duration-300 group-open:rotate-90 shrink-0" />
							</summary>
							<p className="mt-3 pb-2 text-muted-foreground leading-relaxed border-t border-amber-500/10 pt-4">{item.a}</p>
						</motion.details>
					))}
				</motion.div>
			</section>

			{/* Footer - Radiant Momentum */}
			<footer className="border-t border-amber-500/10 bg-background/80 backdrop-blur-sm">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
					<div className="flex items-center gap-4 text-muted-foreground">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl radiant-icon text-white">
							<Logo className="h-8 w-8" />
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-medium">&copy; {new Date().getFullYear()} Daily Bag</span>
							<span className="text-xs">
								Built by{' '}
								<a
									href="https://github.com/abrown84"
									target="_blank"
									rel="noopener noreferrer"
									className="radiant-text hover:underline"
								>
									Alex Brown
								</a>
							</span>
						</div>
					</div>
					<div className="flex items-center gap-8 text-sm text-muted-foreground">
						<a href="#" className="hover:text-amber-400 transition-colors duration-300">Privacy</a>
						<a href="#" className="hover:text-amber-400 transition-colors duration-300">Terms</a>
						<a href="#" className="hover:text-amber-400 transition-colors duration-300">Contact</a>
						<a
							href="https://github.com/abrown84/Chore-Checklist"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-1"
						>
							GitHub
						</a>
					</div>
				</div>
			</footer>

			{/* Auth Modal */}
			{showAuthModal && (
				<AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
			)}

			{/* Install Guide Modal */}
			{showInstallGuide && (
				<>
					{/* Backdrop */}
					<div
						ref={installGuideBackdropRef}
						onClick={() => setShowInstallGuide(false)}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
						style={{ opacity: 0 }}
					/>
					{/* Modal */}
					<div
						ref={installGuideModalRef}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
						style={{ opacity: 0 }}
					>
						<Card className="w-full max-w-2xl border-border bg-card/95 backdrop-blur-md shadow-xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-xl font-heading font-semibold">
											Install Daily Bag
										</h2>
										<p className="text-sm text-muted-foreground mt-1">
											Follow these steps to install the app on your device
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowInstallGuide(false)}
										className="h-8 w-8"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent className="max-h-[70vh] overflow-y-auto">
								<PWAInstallGuide />
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button
									variant="outline"
									onClick={() => setShowInstallGuide(false)}
								>
									Close
								</Button>
								<Button
									onClick={() => {
										setShowInstallGuide(false)
										openAuthModal()
									}}
									className="bg-amber-400 text-slate-900 hover:bg-amber-300"
								>
									Sign In Instead
								</Button>
							</CardFooter>
						</Card>
					</div>
				</>
			)}

			{/* Video Overview Modal */}
			{showVideoModal && (
				<>
					{/* Backdrop */}
					<div
						ref={videoBackdropRef}
						onClick={closeVideoModal}
						onTouchStart={closeVideoModal}
						className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
						style={{ opacity: 0 }}
					/>
					{/* Modal */}
					<div
						ref={videoModalRef}
						className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 md:pt-24 p-2 sm:p-4 md:p-6"
						onClick={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						style={{ opacity: 0 }}
					>
						<div className="relative w-full max-w-4xl mx-auto">
							<Button
								variant="ghost"
								size="icon"
								onClick={closeVideoModal}
								onTouchStart={closeVideoModal}
								className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/70 hover:bg-black/90 active:bg-black text-white backdrop-blur-sm touch-manipulation"
								aria-label="Close video"
							>
								<X className="h-5 w-5 sm:h-6 sm:w-6" />
							</Button>
							<div className="relative w-full bg-black rounded-lg overflow-hidden shadow-xl" style={{ aspectRatio: '16/9' }}>
								<video
									ref={videoRef}
									className="w-full h-full object-contain"
									controls
									autoPlay
									playsInline
									muted={true}
									preload="auto"
									onClick={(e) => {
										e.stopPropagation();
										// Unmute when user clicks the video
										if (videoRef.current) {
											videoRef.current.muted = false;
										}
									}}
									onTouchStart={(e) => {
										e.stopPropagation();
										// Unmute when user touches the video
										if (videoRef.current) {
											videoRef.current.muted = false;
										}
									}}
									onPlay={() => {
										// Ensure video is unmuted when playing (after user interaction)
										if (videoRef.current) {
											videoRef.current.muted = false;
										}
									}}
								>
									<source src="/1130.mp4" type="video/mp4" />
									Your browser does not support the video tag.
								</video>
							</div>
						</div>
					</div>
				</>
			)}
		</PageWrapper>
	)
}
