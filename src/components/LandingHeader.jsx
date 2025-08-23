import React from 'react';
import { Link } from 'react-router-dom';

function LandingHeader() {
  return (
    <header className="bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-white text-lg">
                C
            </div>
            <span className="text-xl font-bold text-gray-800">Cohesio</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/features" className="text-gray-600 font-medium hover:text-highlight transition-colors">Features</Link>
          <Link to="/pricing" className="text-gray-600 font-medium hover:text-highlight transition-colors">Pricing</Link>
          <Link to="/about" className="text-gray-600 font-medium hover:text-highlight transition-colors">About Us</Link>
          <Link to="/contact" className="text-gray-600 font-medium hover:text-highlight transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-gray-600 font-medium hover:text-highlight transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition-colors">
            Sign Up Free
          </Link>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;