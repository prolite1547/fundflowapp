import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  PieChart, 
  Target, 
  Tag,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/transactions', icon: <ArrowLeftRight size={20} />, label: 'Transactions' },
    { to: '/accounts', icon: <Wallet size={20} />, label: 'Accounts' },
    { to: '/categories', icon: <Tag size={20} />, label: 'Categories' },
    { to: '/budgets', icon: <Target size={20} />, label: 'Budgets' },
    { to: '/reports', icon: <PieChart size={20} />, label: 'Reports' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="mobile-toggle btn-primary glass"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar glass ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.svg" alt="FundFlow Logo" className="sidebar-logo" />
          <h2 className="text-gradient">FundFlow</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-link logout-btn" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
