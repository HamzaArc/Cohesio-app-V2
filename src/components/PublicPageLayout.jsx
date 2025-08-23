import React from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

function PublicPageLayout({ children, title }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-x-hidden">
      {/* Artistic Background Circles */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div 
          className="absolute bg-blue-100 rounded-full opacity-50"
          style={{ top: '-20vh', right: '-15vw', width: '60vw', height: '60vw' }}
        ></div>
        <div 
          className="absolute bg-yellow-100 rounded-full opacity-50"
          style={{ bottom: '-30vh', left: '-20vw', width: '70vw', height: '70vw' }}
        ></div>
         <div 
          className="absolute bg-highlight/20 rounded-full opacity-30"
          style={{ top: '50vh', left: '10vw', width: '20vw', height: '20vw' }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow">
        <LandingHeader />
        <main className="pt-32 pb-20 flex-grow">
          <div className="container mx-auto px-6">
            {title && <h1 className="text-4xl font-bold text-primary text-center mb-12">{title}</h1>}
            {children}
          </div>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

export default PublicPageLayout;