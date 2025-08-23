import React, { useState } from 'react';
import PublicPageLayout from '../components/PublicPageLayout';
import { CheckCircle, ChevronDown, ChevronUp, Users, Briefcase, Building } from 'lucide-react';

// --- Helper Data ---
const pricingTiers = [
  {
    name: 'Starter',
    id: 'starter',
    priceMonthly: 49,
    priceAnnually: 490,
    description: 'For small teams just getting started with HR basics.',
    features: [
      'Employee Directory',
      'Leave Tracking (5 days/month)',
      'Basic Reporting',
      'Mobile App Access',
      'Email Support',
    ],
    icon: Users,
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    id: 'professional',
    priceMonthly: 99,
    priceAnnually: 990,
    description: 'For growing businesses that need more advanced features.',
    features: [
      'Everything in Starter',
      'Performance Management',
      'Onboarding & Offboarding',
      'Advanced Reporting & Analytics',
      'Priority Email & Chat Support',
      'ATS Integration (up to 2)',
    ],
    icon: Briefcase,
    popular: true,
    cta: 'Choose Professional',
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    priceMonthly: 'Custom',
    description: 'For large organizations with complex needs and compliance.',
    features: [
      'Everything in Professional',
      'Custom Workflows',
      'Dedicated Account Manager',
      'Single Sign-On (SSO)',
      'Advanced Security & Compliance',
      'API Access',
    ],
    icon: Building,
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    question: 'Can I change my plan later?',
    answer: 'Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Prorated charges or credits will be applied automatically.',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, we offer a 14-day free trial on our Professional plan. No credit card is required to get started. You can explore all the features and see if it\'s the right fit for your team.',
  },
  {
    question: 'What happens if I exceed my employee limit?',
    answer: 'Our plans are designed to scale with you. If you exceed the employee limit for your current plan, we\'ll notify you and you can easily upgrade to the next tier.',
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer: 'Yes, we are happy to support non-profit organizations. Please contact our sales team with your non-profit documentation to learn more about our special pricing.',
  },
  {
    question: 'How secure is my data?',
    answer: 'Data security is our top priority. We use industry-standard encryption, regular security audits, and comply with major data protection regulations like GDPR and CCPA to ensure your information is always safe.'
  }
];

// --- Components ---

const PricingToggle = ({ billingCycle, setBillingCycle }) => (
  <div className="flex justify-center items-center space-x-4 mb-12">
    <span className={`text-lg transition-colors duration-300 ${billingCycle === 'monthly' ? 'text-primary font-semibold' : 'text-accent'}`}>
      Monthly
    </span>
    <label htmlFor="billing-toggle" className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id="billing-toggle"
        className="sr-only peer"
        checked={billingCycle === 'annually'}
        onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
      />
      <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-highlight"></div>
    </label>
    <div className="flex items-center">
        <span className={`text-lg transition-colors duration-300 ${billingCycle === 'annually' ? 'text-primary font-semibold' : 'text-accent'}`}>
        Annually
        </span>
        <span className="ml-3 bg-highlight/20 text-highlight text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Save 20%
        </span>
    </div>
  </div>
);

const PricingCard = ({ tier, billingCycle }) => {
  const isPopular = tier.popular;
  const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceAnnually;

  return (
    <div className={`relative flex flex-col p-8 rounded-2xl border shadow-lg transition-transform duration-300 hover:scale-105 ${isPopular ? 'border-highlight bg-white' : 'bg-white border-gray-200'}`}>
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
          <span className="bg-highlight text-white text-sm font-semibold px-4 py-1 rounded-full">Most Popular</span>
        </div>
      )}
      <div className="flex-grow">
        <div className="flex items-center space-x-3 mb-4">
            <tier.icon className="h-8 w-8 text-highlight" />
            <h3 className="text-2xl font-bold text-primary">{tier.name}</h3>
        </div>
        <p className="text-accent mb-6 h-12">{tier.description}</p>
        
        <div className="mb-8">
            {typeof price === 'number' ? (
                <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-primary tracking-tight">${price}</span>
                    <span className="text-xl font-semibold text-accent">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
            ) : (
                <span className="text-4xl font-extrabold text-primary tracking-tight">{price}</span>
            )}
        </div>

        <ul className="space-y-4 text-secondary">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-highlight mr-3 flex-shrink-0 mt-1" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <button className={`w-full mt-10 py-3 px-6 rounded-lg font-semibold text-lg transition-transform duration-200 hover:scale-102 ${isPopular ? 'bg-highlight text-white hover:bg-opacity-90' : 'bg-primary text-white hover:bg-secondary'}`}>
        {tier.cta}
      </button>
    </div>
  );
};

const FAQItem = ({ faq, index, openIndex, setOpenIndex }) => {
  const isOpen = index === openIndex;

  return (
    <div className="border-b border-gray-200 py-6">
      <dt>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="flex w-full items-start justify-between text-left text-primary"
        >
          <span className="text-lg font-medium">{faq.question}</span>
          <span className="ml-6 flex h-7 items-center">
            {isOpen ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-400" />
            )}
          </span>
        </button>
      </dt>
      {isOpen && (
        <dd className="mt-4 pr-12">
          <p className="text-base leading-7 text-accent">{faq.answer}</p>
        </dd>
      )}
    </div>
  );
};

function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <PublicPageLayout>
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight mb-4">
            Find the perfect plan
          </h1>
          <p className="text-xl text-accent max-w-3xl mx-auto">
            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users.
          </p>
        </header>

        <PricingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} billingCycle={billingCycle} />
          ))}
        </div>

        <section className="max-w-4xl mx-auto mt-24 sm:mt-32">
            <h2 className="text-4xl font-extrabold text-center text-primary mb-12">
                Frequently Asked Questions
            </h2>
            <dl className="space-y-4">
                {faqs.map((faq, index) => (
                    <FAQItem 
                        key={index}
                        faq={faq}
                        index={index}
                        openIndex={openFaqIndex}
                        setOpenIndex={setOpenFaqIndex}
                    />
                ))}
            </dl>
        </section>
    </PublicPageLayout>
  );
}

export default Pricing;