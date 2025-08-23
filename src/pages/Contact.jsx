import React, { useState, useEffect, useRef } from 'react';
import PublicPageLayout from '../components/PublicPageLayout';
import { Phone, Mail, MapPin, Building, Send, CheckCircle } from 'lucide-react';

// --- Page Specific Components ---

const ContactHero = () => (
    <section className="py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
            Get in touch
        </h1>
        <p className="text-lg md:text-xl text-accent max-w-3xl mx-auto">
            We’d love to hear from you. Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
        </p>
    </section>
);

const ContactFormSection = () => {
    const [formStatus, setFormStatus] = useState('idle');

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormStatus('submitting');
        // This is a mock submission. In a real app, you'd handle the form submission here.
        setTimeout(() => {
            setFormStatus('success');
        }, 1500);
    };

    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-primary mb-4">Contact Information</h2>
                            <p className="text-accent text-lg">
                                Choose your preferred method to reach out. We're here to help you on your journey to better HR.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start space-x-5">
                                <div className="bg-highlight/20 text-highlight rounded-lg h-12 w-12 flex items-center justify-center flex-shrink-0">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary">Email Us</h3>
                                    <p className="text-accent mb-1">For general inquiries and support.</p>
                                    <a href="mailto:support@cohesio.app" className="font-semibold text-highlight hover:underline">support@cohesio.app</a>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start space-x-5">
                                <div className="bg-highlight/20 text-highlight rounded-lg h-12 w-12 flex items-center justify-center flex-shrink-0">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary">Call Us</h3>
                                    <p className="text-accent mb-1">Speak with our sales team directly.</p>
                                    <a href="tel:+1-202-555-0149" className="font-semibold text-highlight hover:underline">+1-202-555-0149</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200/50">
                        {formStatus === 'success' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-highlight/20 text-highlight rounded-full h-16 w-16 flex items-center justify-center mb-6">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-primary mb-2">Thank you!</h3>
                                <p className="text-accent max-w-sm">Your message has been sent successfully. We'll get back to you within 24 business hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3 className="text-2xl font-bold text-primary mb-6">Send us a message</h3>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="first-name" className="block text-sm font-medium text-secondary mb-2">First Name</label>
                                        <input type="text" id="first-name" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight transition" />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name" className="block text-sm font-medium text-secondary mb-2">Last Name</label>
                                        <input type="text" id="last-name" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight transition" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">Email</label>
                                        <input type="email" id="email" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight transition" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="message" className="block text-sm font-medium text-secondary mb-2">Message</label>
                                        <textarea id="message" rows="4" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight transition"></textarea>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <button type="submit" disabled={formStatus === 'submitting'} className="w-full flex items-center justify-center bg-primary text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-secondary transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-opacity-70 disabled:cursor-not-allowed">
                                        {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                                        <Send className="h-5 w-5 ml-2" />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const LocationSection = () => {
    const mapRef = useRef(null);
    const mapInitialized = useRef(false);

    useEffect(() => {
        const initMap = () => {
            if (window.L && mapRef.current && !mapInitialized.current) {
                const position = [37.7749, -122.4194];
                
                const map = window.L.map(mapRef.current, {
                    scrollWheelZoom: false,
                    zoomControl: false
                }).setView(position, 14);

                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }).addTo(map);

                const customIcon = window.L.divIcon({
                    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-10 w-10">
                               <path fill="#5bc0be" d="M12 0C7.589 0 4 3.589 4 8c0 4.411 8 16 8 16s8-11.589 8-16c0-4.411-3.589-8-8-8zm0 12a4 4 0 110-8 4 4 0 010 8z"/>
                               <circle fill="#fff" cx="12" cy="8" r="2"/>
                           </svg>`,
                    className: '',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                });

                window.L.marker(position, { icon: customIcon }).addTo(map)
                    .bindPopup('<b>Cohesio HQ</b><br>123 Innovation Drive, SF')
                    .openPopup();
                
                mapInitialized.current = true;
            }
        };

        if (window.L) {
            initMap();
        } else {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
            link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
            link.crossOrigin = '';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
            script.integrity = 'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
            script.crossOrigin = '';
            script.async = true;
            script.onload = initMap;
            document.body.appendChild(script);
        }
    }, []);

    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
                        Our Location
                    </h2>
                    <p className="text-lg text-accent max-w-2xl mx-auto">
                        Come say hello at our headquarters in the heart of San Francisco.
                    </p>
                </div>
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="bg-highlight/20 text-highlight rounded-lg h-10 w-10 flex items-center justify-center flex-shrink-0 mt-1">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">San Francisco Office</h3>
                                <p className="text-accent">123 Innovation Drive<br/>Suite 456, San Francisco, CA 94105</p>
                            </div>
                        </div>
                         <div className="flex items-start space-x-4">
                            <div className="bg-highlight/20 text-highlight rounded-lg h-10 w-10 flex items-center justify-center flex-shrink-0 mt-1">
                                <Building className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">Business Hours</h3>
                                <p className="text-accent">Monday - Friday<br/>9:00 AM - 6:00 PM PST</p>
                            </div>
                        </div>
                    </div>
                    <div ref={mapRef} className="h-80 w-full rounded-xl shadow-md z-10 border border-gray-200"></div>
                </div>
            </div>
        </section>
    );
};


function Contact() {
  return (
    <PublicPageLayout>
        <ContactHero />
        <ContactFormSection />
        <LocationSection />
    </PublicPageLayout>
  );
}

export default Contact;