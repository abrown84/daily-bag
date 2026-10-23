import React, { useState, useRef, useEffect } from 'react'
import { animate } from 'animejs'
import { PageWrapper } from './PageWrapper'
import { PricingCard } from './PricingCard'
import { Card, CardContent } from './ui/card'
import { Check, CaretDown, CaretUp, Shield, Lightning, Users, Star, Question } from '@phosphor-icons/react'
import { useSubscription } from '../hooks/useSubscription'
import { PLANS, BillingInterval, SubscriptionPlan } from '../types/subscription'
import { cn } from '../utils/cn'
import { EmbeddedCheckoutModal } from './EmbeddedCheckoutModal'

const faqs = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.',
  },
  {
    question: 'What happens when my free trial ends?',
    answer:
      "If you don't add a payment method, you'll automatically be switched to the Free plan. No charges will be made without your consent.",
  },
  {
    question: 'Is there a family plan?',
    answer:
      'Our Premium plan includes unlimited household members, so your whole family can use it under one subscription.',
  },
  {
    question: 'Can I switch between monthly and yearly billing?',
    answer:
      "Yes, you can switch billing intervals at any time. If you switch from monthly to yearly, you'll receive a prorated credit.",
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through our secure Stripe payment system.',
  },
]

const comparisonFeatures = [
  { name: 'Number of chores', free: 'Up to 10', premium: 'Unlimited' },
  { name: 'Household members', free: 'Up to 4', premium: 'Unlimited' },
  { name: 'Basic rewards', free: true, premium: true },
  { name: 'Custom rewards', free: false, premium: true },
  { name: 'Leaderboard', free: true, premium: true },
  { name: 'Level progression', free: true, premium: true },
  { name: 'Photo verification', free: false, premium: true },
  { name: 'Recurring chores', free: false, premium: true },
  { name: 'Advanced analytics', free: false, premium: true },
  { name: 'Data export', free: false, premium: true },
  { name: 'Priority support', free: false, premium: true },
]

export const PricingPage: React.FC = () => {
  const { currentPlan } = useSubscription()
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // Animation refs
  const trustBadgesRef = useRef<HTMLDivElement>(null)
  const billingToggleRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const faqSectionRef = useRef<HTMLDivElement>(null)
  const guaranteeRef = useRef<HTMLDivElement>(null)
  const faqCardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Animate trust badges
    if (trustBadgesRef.current) {
      animate(trustBadgesRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        ease: 'outQuart',
      })
    }
    // Animate billing toggle
    if (billingToggleRef.current) {
      animate(billingToggleRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        delay: 100,
        ease: 'outQuart',
      })
    }
    // Animate comparison table
    if (comparisonRef.current) {
      animate(comparisonRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        delay: 200,
        ease: 'outQuart',
      })
    }
    // Animate FAQ section header
    if (faqSectionRef.current) {
      animate(faqSectionRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        delay: 300,
        ease: 'outQuart',
      })
    }
    // Animate FAQ cards
    faqCardsRef.current.forEach((card, index) => {
      if (card) {
        animate(card, {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 400,
          delay: 100 + index * 50,
          ease: 'outQuart',
        })
      }
    })
    // Animate guarantee section
    if (guaranteeRef.current) {
      animate(guaranteeRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        delay: 400,
        ease: 'outQuart',
      })
    }
  }, [])

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === 'free' || planId === currentPlan) return
    // Open embedded checkout modal instead of redirecting
    setShowCheckout(true)
  }

  const yearlyPrice = PLANS.premium.yearlyPrice
  const monthlyPrice = PLANS.premium.monthlyPrice
  const savingsPercent = Math.round(
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
  )

  return (
    <PageWrapper
      title="Choose Your Plan"
      description="Get more from Daily Bag with Premium features"
    >
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Trust badges */}
        <div
          ref={trustBadgesRef}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-0"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-400" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightning className="h-4 w-4 text-amber-400" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-blue-400" />
            <span>10,000+ Families</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>4.9/5 Rating</span>
          </div>
        </div>

        {/* Billing toggle */}
        <div
          ref={billingToggleRef}
          className="flex justify-center opacity-0"
        >
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-secondary/50 border border-border">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                billingInterval === 'monthly'
                  ? 'bg-foreground text-background shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2',
                billingInterval === 'yearly'
                  ? 'bg-foreground text-background shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">
                Save {savingsPercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <PricingCard
            plan={PLANS.free}
            billingInterval={billingInterval}
            isCurrentPlan={currentPlan === 'free'}
            onSelect={handleSelectPlan}
            index={0}
          />
          <PricingCard
            plan={PLANS.premium}
            billingInterval={billingInterval}
            isCurrentPlan={currentPlan === 'premium'}
            onSelect={handleSelectPlan}
            index={1}
          />
        </div>

        {/* Feature comparison table */}
        <div
          ref={comparisonRef}
          className="opacity-0"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-heading font-bold text-foreground">
                  Compare Plans
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  See what's included in each plan
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-4 font-medium text-foreground">
                        Feature
                      </th>
                      <th className="text-center p-4 font-medium text-foreground w-32">
                        Free
                      </th>
                      <th className="text-center p-4 font-medium text-amber-400 w-32">
                        Premium
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr
                        key={feature.name}
                        className={cn(
                          'border-b border-border/50',
                          index % 2 === 0 ? 'bg-secondary/10' : ''
                        )}
                      >
                        <td className="p-4 text-sm text-foreground">
                          {feature.name}
                        </td>
                        <td className="p-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {feature.free}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof feature.premium === 'boolean' ? (
                            feature.premium ? (
                              <Check className="h-5 w-5 text-amber-400 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            <span className="text-sm font-medium text-amber-400">
                              {feature.premium}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ section */}
        <div
          ref={faqSectionRef}
          className="space-y-6 opacity-0"
        >
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mt-2">
              Have questions? We've got answers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                ref={(el) => { faqCardsRef.current[index] = el }}
                className="opacity-0"
              >
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    expandedFaq === index
                      ? 'border-amber-400/50 shadow-md'
                      : 'hover:border-border/80'
                  )}
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Question className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-sm">
                            {faq.question}
                          </h3>
                          <div
                            className={cn(
                              'overflow-hidden transition-all duration-200',
                              expandedFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                            )}
                          >
                            <p className="text-sm text-muted-foreground mt-2">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedFaq === index ? (
                          <CaretUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <CaretDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Money-back guarantee */}
        <div
          ref={guaranteeRef}
          className="text-center opacity-0"
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    30-Day Money-Back Guarantee
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Not satisfied? Get a full refund within 30 days, no questions
                    asked.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact support */}
        <div className="text-center pb-8">
          <p className="text-sm text-muted-foreground">
            Still have questions?{' '}
            <a
              href="mailto:support@dailybag.app"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>

      <EmbeddedCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        billingInterval={billingInterval}
      />
    </PageWrapper>
  )
}
