import React from 'react';
import PublicPageLayout from '../components/PublicPageLayout';
import { Target, Lightbulb, Heart, Users } from 'lucide-react';

// Importing your local image for the "Our Story" section
import aboutus from '../assets/images/Our_Team.png';

// --- Page Specific Components ---

const AboutHero = () => (
    <section className="py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
            We're on a mission to make <br />
            <span className="text-highlight">work better for everyone.</span>
        </h1>
        <p className="text-lg md:text-xl text-accent max-w-3xl mx-auto">
            We believe that when people thrive, businesses thrive. That's why we're building the tools to help companies create cultures of engagement, growth, and success.
        </p>
    </section>
);

const OurStory = () => (
    <section className="py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
                <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-6">Our Story</h2>
                <div className="space-y-6 text-accent text-lg leading-relaxed">
                    <p>
                        Cohesio was founded in 2020 by a group of HR professionals and software engineers who saw a gap in the market. Traditional HR software was clunky, complicated, and focused more on processes than people.
                    </p>
                    <p>
                        We envisioned a world where HR tools were intuitive, beautiful, and empowering for employees and managers alike. We set out to build a platform that automates the tedious tasks so HR teams can focus on what truly matters: building a great place to work.
                    </p>
                    <p>
                        Today, we're proud to serve hundreds of innovative companies, helping them transform their people operations and create thriving workplace cultures.
                    </p>
                </div>
            </div>
            <div className="order-1 lg:order-2">
                <img 
                    src={aboutus}
                    alt="Our Team"
                    className="rounded-2xl shadow-xl w-full h-auto"
                />
            </div>
        </div>
    </section>
);

const ValueCard = ({ icon: Icon, title, children }) => (
    <div className="text-center p-8">
        <div className="bg-highlight/20 text-highlight rounded-full h-16 w-16 flex items-center justify-center mb-5 mx-auto">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
        <p className="text-accent leading-relaxed">{children}</p>
    </div>
);

const OurValues = () => (
    <section className="py-20">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
                The values that drive us
            </h2>
            <p className="text-lg text-accent max-w-2xl mx-auto">
                These principles guide our decisions, our product, and our culture.
            </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <ValueCard icon={Heart} title="Customer-Centric">
                We succeed when our customers succeed. We listen intently and build solutions that solve real problems.
            </ValueCard>
            <ValueCard icon={Lightbulb} title="Innovate & Simplify">
                We challenge the status quo and seek to make the complex simple, powerful, and elegant.
            </ValueCard>
            <ValueCard icon={Users} title="People First">
                We build for people. Our team, our customers, and their employees are at the heart of everything we do.
            </ValueCard>
            <ValueCard icon={Target} title="Own It">
                We are accountable for our work, our commitments, and our impact. We act with integrity and transparency.
            </ValueCard>
        </div>
    </section>
);

const TeamMemberCard = ({ name, title, image }) => (
    <div className="text-center">
        <img 
            src={image}
            alt={`Portrait of ${name}`}
            className="w-40 h-40 rounded-full mx-auto mb-4 shadow-lg"
        />
        <h3 className="text-xl font-bold text-primary">{name}</h3>
        <p className="text-highlight font-medium">{title}</p>
    </div>
);

const MeetTheTeam = () => (
    <section className="py-20">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
                Meet the leadership
            </h2>
            <p className="text-lg text-accent max-w-2xl mx-auto">
                A passionate group of innovators dedicated to improving the world of work.
            </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <TeamMemberCard name="Jane Doe" title="Co-Founder & CEO" image="https://xsgames.co/randomusers/assets/avatars/female/68.jpg" />
            <TeamMemberCard name="John Smith" title="Co-Founder & CTO" image="https://xsgames.co/randomusers/assets/avatars/male/74.jpg" />
            <TeamMemberCard name="Emily White" title="VP of Product" image="https://xsgames.co/randomusers/assets/avatars/female/63.jpg" />
            <TeamMemberCard name="Michael Brown" title="VP of Sales" image="https://xsgames.co/randomusers/assets/avatars/male/76.jpg" />
        </div>
    </section>
);

const CareersCTA = () => (
    <section>
        <div className="container mx-auto px-4 py-20">
            <div className="bg-primary rounded-2xl p-12 text-center relative overflow-hidden">
                 <div aria-hidden="true" className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-0 h-full w-full bg-black/20"></div>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                    Join our growing team!
                </h2>
                <p className="text-lg text-light max-w-2xl mx-auto mb-10">
                    We're looking for passionate people to join us on our mission. If you're excited about shaping the future of work, we'd love to hear from you.
                </p>
                <a href="#" className="bg-highlight text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5">
                    View Open Positions
                </a>
            </div>
        </div>
    </section>
);


function About() {
  return (
    <PublicPageLayout>
        <AboutHero />
        <OurStory />
        <OurValues />
        <MeetTheTeam />
        <CareersCTA />
    </PublicPageLayout>
  );
}

export default About;