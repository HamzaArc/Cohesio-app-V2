import React from 'react';
import PublicPageLayout from '../components/PublicPageLayout';
import { Users, DollarSign, Calendar, FileText, BookOpen, MessageSquare, BarChart2, CheckCircle } from 'lucide-react';

// Importing your local images
import peopleManagementIllustration from '../assets/images/People_Management_Illustration.png';
import payrollIllustration from '../assets/images/Payroll_Illustration.png';
import timeOffIllustration from '../assets/images/Time_Off_Illustration.png';
import documentManagementIllustration from '../assets/images/Document_Management_Illustration.png';
import trainingIllustration from '../assets/images/Training_Illustration.png';
import reportingIllustration from '../assets/images/Reporting_Illustration.png';


const FeatureDetail = ({ icon, title, description, points, image, imageAlt, reverse }) => (
    <div className={`py-12 flex flex-col md:flex-row items-center gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
        <div className="md:w-1/2">
            <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-highlight/20 text-highlight flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-primary ml-4">{title}</h3>
            </div>
            <p className="mt-2 text-lg text-accent">{description}</p>
            <ul className="mt-4 space-y-2">
                {points.map((point, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-highlight mr-2 mt-1 flex-shrink-0" />
                        <span className="text-secondary">{point}</span>
                    </li>
                ))}
            </ul>
        </div>
        <div className="md:w-1/2">
             <div className="bg-white p-4 rounded-lg shadow-2xl transform transition-transform hover:scale-105">
                <img src={image} alt={imageAlt} className="rounded-md" />
            </div>
        </div>
    </div>
);

function Features() {
  return (
    <PublicPageLayout title="A Better Way to Manage Your Team">
        <p className="text-xl text-accent text-center max-w-3xl mx-auto">
            Meet Alex, a small business owner juggling countless tasks. Alex's journey with Cohesio transforms HR from a daily challenge into a streamlined, efficient, and empowering part of the business.
        </p>
      
        <div className="mt-12">
            <FeatureDetail 
                icon={<Users size={24} />}
                title="People Management"
                description="Alex starts by building a central hub for all employee information. No more scattered spreadsheets or lost files."
                points={[
                    "Create detailed employee profiles with custom fields.",
                    "Visualize your company structure with an interactive org chart.",
                    "Track career progression and historical changes with Employee Journey."
                ]}
                image={peopleManagementIllustration}
                imageAlt="People Management Illustration"
            />
            <FeatureDetail 
                icon={<DollarSign size={24} />}
                title="Payroll"
                description="With the team in place, Alex runs payroll in minutes, not days. Complex calculations are now a thing of the past."
                points={[
                    "Automate payroll calculations with ease.",
                    "Handle off-cycle and bonus payments effortlessly.",
                    "Generate professional payslips for every employee."
                ]}
                image={payrollIllustration}
                imageAlt="Payroll Illustration"
                reverse={true}
            />
            <FeatureDetail 
                icon={<Calendar size={24} />}
                title="Time Off"
                description="Alex sets up a time-off policy, allowing the team to request leave and see balances, all while keeping everyone in sync."
                points={[
                    "Create custom time-off policies for vacation, sick leave, and more.",
                    "Approve or deny requests with a single click.",
                    "Visualize team availability with a shared calendar."
                ]}
                image={timeOffIllustration}
                imageAlt="Time Off Illustration"
            />
            <FeatureDetail 
                icon={<FileText size={24} />}
                title="Document Management"
                description="Important documents are now securely stored and easily accessible. Alex sends out the new employee handbook and tracks who has acknowledged it."
                points={[
                    "Upload and share important documents with your team.",
                    "Request and track document acknowledgments.",
                    "Ensure compliance with version control and audit trails."
                ]}
                image={documentManagementIllustration}
                imageAlt="Document Management Illustration"
                reverse={true}
            />
            <FeatureDetail 
                icon={<BookOpen size={24} />}
                title="Training & Development"
                description="To help the team grow, Alex creates and assigns training programs, tracking their progress and ensuring everyone has the skills they need to succeed."
                points={[
                    "Create and assign custom training programs.",
                    "Track employee progress and completion rates.",
                    "Build a culture of continuous learning and development."
                ]}
                image={trainingIllustration}
                imageAlt="Training Illustration"
            />
            <FeatureDetail 
                icon={<BarChart2 size={24} />}
                title="Reporting & Analytics"
                description="With a clear view of HR data, Alex can make informed decisions about the future of the business."
                points={[
                    "Visualize headcount growth and other key metrics.",
                    "Generate custom reports to track trends and identify opportunities.",
                    "Make data-driven decisions to improve your HR processes."
                ]}
                image={reportingIllustration}
                imageAlt="Reporting Illustration"
                reverse={true}
            />
        </div>
    </PublicPageLayout>
  );
}

export default Features;