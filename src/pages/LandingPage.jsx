import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import { ChevronDown, CheckCircle, ArrowRight, Star, Users, DollarSign, Zap, Briefcase, Building } from 'lucide-react';

// --- Reusable Components ---

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

// --- Page Component ---

function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(0);
  const [pricingPlan, setPricingPlan] = useState('monthly');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const pricingTiers = [
    {
      name: 'Starter',
      id: 'starter',
      priceMonthly: 49,
      priceAnnually: 39,
      description: 'For small teams just getting started with HR basics.',
      features: [
        'Up to 50 employees',
        'Employee Directory',
        'Time Off Tracking',
        'Basic Reporting'
      ],
      icon: Users,
      cta: 'Choose Plan',
    },
    {
      name: 'Business',
      id: 'business',
      priceMonthly: 99,
      priceAnnually: 79,
      description: 'For growing businesses that need more advanced features.',
      features: [
        'Up to 200 employees',
        'Payroll Automation',
        'Recruitment Tools',
        'Performance Management',
      ],
      icon: Briefcase,
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      id: 'enterprise',
      priceMonthly: 'Custom',
      description: 'For large organizations with complex needs and compliance.',
      features: [
        'Unlimited employees',
        'Dedicated Account Manager',
        'Advanced Security & SSO',
        'API Access',
      ],
      icon: Building,
      cta: 'Contact Sales',
    },
  ];

  const faqs = [
    {
      question: "What is Cohesio?",
      answer: "Cohesio is a comprehensive HR management system designed to streamline your HR processes, from recruitment and onboarding to payroll and performance management. Our goal is to help you save time and focus on what matters most: your people."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We prioritize data security and use industry-standard encryption and security protocols to protect your sensitive information. Our systems are GDPR and CCPA compliant."
    },
    {
      question: "Can I integrate Cohesio with other tools?",
      answer: "Yes, Cohesio offers seamless integrations with a variety of popular tools, including accounting software, project management platforms, and communication apps to ensure a smooth workflow."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes, we offer a 14-day free trial on all our plans. You can explore all the features of Cohesio with no commitment and no credit card required."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "HR Manager, TechCorp",
      quote: "Cohesio has revolutionized our HR operations. The intuitive interface and powerful automation features have saved us countless hours. It's a game-changer!",
      avatar: "https://xsgames.co/randomusers/assets/avatars/female/60.jpg"
    },
    {
      name: "Michael Chen",
      title: "CEO, Innovate Ltd.",
      quote: "As a startup, we needed an affordable and scalable HR solution. Cohesio exceeded our expectations. The support team is fantastic and always responsive.",
      avatar: "https://xsgames.co/randomusers/assets/avatars/male/78.jpg"
    },
    {
      name: "Emily Rodriguez",
      title: "Operations Director, Creative Minds",
      quote: "The employee self-service portal is a huge plus. Our team loves the transparency and ease of use. Payroll processing is now a breeze. Highly recommended!",
      avatar: "https://xsgames.co/randomusers/assets/avatars/female/65.jpg"
    }
  ];

  return (
    <PublicPageLayout>
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-block bg-highlight/20 text-highlight text-sm font-semibold px-4 py-1 rounded-full mb-4 scroll-animate">
              The #1 HR Platform for Growing Businesses
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight mb-6 scroll-animate" style={{ animationDelay: '200ms' }}>
              Modern HR Management, <br />Beautifully Simplified
            </h2>
            <p className="text-lg md:text-xl text-accent mb-10 max-w-2xl mx-auto scroll-animate" style={{ animationDelay: '400ms' }}>
              Cohesio empowers you to manage your entire workforce from a single, intuitive platform. Spend less time on administrative tasks and more time building a great company culture.
            </p>
            <div className="flex justify-center items-center space-x-4 scroll-animate" style={{ animationDelay: '600ms' }}>
              <Link to="/signup" className="bg-highlight text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                Start Your Free Trial
              </Link>
              <a href="#features" className="flex items-center text-highlight font-semibold text-lg hover:text-opacity-80 transition-colors">
                Learn More <ArrowRight className="ml-2" size={20} />
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 scroll-animate">Everything you need, all in one place.</h3>
              <p className="text-accent text-lg scroll-animate" style={{ animationDelay: '200ms' }}>
                From hiring to retiring, Cohesio provides a complete suite of tools to manage your employees effectively and efficiently.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow scroll-animate">
                <div className="bg-highlight/20 text-highlight w-14 h-14 rounded-full flex items-center justify-center mb-6">
                  <Users size={28} />
                </div>
                <h4 className="text-xl font-bold text-primary mb-3">Employee Management</h4>
                <p className="text-accent">Keep all employee records organized and accessible. Manage profiles, documents, time off, and more in a centralized database.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow scroll-animate" style={{ animationDelay: '200ms' }}>
                <div className="bg-highlight/20 text-highlight w-14 h-14 rounded-full flex items-center justify-center mb-6">
                  <DollarSign size={28} />
                </div>
                <h4 className="text-xl font-bold text-primary mb-3">Payroll Automation</h4>
                <p className="text-accent">Run payroll in minutes, not days. Automate calculations, tax filings, and payments with our fully integrated payroll system.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow scroll-animate" style={{ animationDelay: '400ms' }}>
                <div className="bg-highlight/20 text-highlight w-14 h-14 rounded-full flex items-center justify-center mb-6">
                  <Zap size={28} />
                </div>
                <h4 className="text-xl font-bold text-primary mb-3">Recruitment & Onboarding</h4>
                <p className="text-accent">Attract top talent with a branded careers page and streamline your hiring process. Create seamless onboarding experiences for new hires.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4 scroll-animate">
                        Choose the plan that's right for you
                    </h2>
                    <p className="text-lg text-accent max-w-2xl mx-auto scroll-animate" style={{ animationDelay: '200ms' }}>
                        Simple, transparent pricing. No hidden fees.
                    </p>
                </div>
                <PricingToggle billingCycle={pricingPlan} setBillingCycle={setPricingPlan} />
                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {pricingTiers.map((tier) => (
                        <PricingCard key={tier.id} tier={tier} billingCycle={pricingPlan} />
                    ))}
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 scroll-animate">Loved by HR leaders worldwide.</h3>
              <p className="text-accent text-lg scroll-animate" style={{ animationDelay: '200ms' }}>
                Don't just take our word for it. Here's what our customers have to say.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 p-8 rounded-xl shadow-sm scroll-animate" style={{ animationDelay: `${index * 200}ms`}}>
                  <div className="flex items-center mb-6">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-16 h-16 rounded-full mr-4" />
                    <div>
                      <p className="font-bold text-primary">{testimonial.name}</p>
                      <p className="text-accent">{testimonial.title}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-current" size={20} />)}
                  </div>
                  <p className="text-accent leading-relaxed">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 scroll-animate">Frequently Asked Questions</h3>
              <p className="text-accent text-lg scroll-animate" style={{ animationDelay: '200ms' }}>
                Have questions? We've got answers.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-animate" style={{ animationDelay: `${index * 100}ms`}}>
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center text-left p-6 font-semibold text-lg text-primary"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`transform transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === index ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <p className="p-6 pt-0 text-accent">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="bg-primary rounded-2xl p-12 text-center text-white relative overflow-hidden scroll-animate">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-16 -right-5 w-56 h-56 bg-white/10 rounded-full"></div>
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your HR?</h3>
                <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
                  Join thousands of companies that trust Cohesio to manage their people operations. Start your free 14-day trial today. No credit card required.
                </p>
                <Link to="/signup" className="bg-highlight text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                  Sign Up for Free
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}

export default LandingPage;