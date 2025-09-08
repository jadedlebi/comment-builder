import React from 'react';
import { Link } from 'react-router-dom';

const NCRCLogo = () => (
  <div className="flex items-center">
    <img 
      src="/ncrc_logo.jpg" 
      alt="NCRC Logo" 
      className="h-12 w-auto flex-shrink-0"
    />
  </div>
);

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center py-3">
          <Link to="/" className="flex items-center">
            <NCRCLogo />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
