import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users } from 'lucide-react';

const NCRCLogo = () => (
  <div className="flex items-center">
    <img 
      src="/ncrc_logo.jpg" 
      alt="NCRC Logo" 
      className="h-7 w-auto mr-2 flex-shrink-0"
    />
    <div>
      <div className="text-sm font-bold text-gray-900">NCRC</div>
      <div className="text-xs text-gray-600">National Community Reinvestment Coalition</div>
    </div>
  </div>
);

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center">
            <NCRCLogo />
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-1 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Active Rulemakings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
