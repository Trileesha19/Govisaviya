import { Sprout, LogOut, ShoppingBag, LayoutDashboard, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAuthModal }) {
  const { user, logout } = useAuth();
  const navigate = (destination) => {
    setActiveTab(destination);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const goToSection = (id) => {
    setActiveTab('marketplace');
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  };
  return <>
    <div className="community-strip"><span><Sprout size={14} /> Grown locally. Connected directly.</span><span><MapPin size={14} /> Rooted in Sri Lanka</span></div>
    <header className="site-header"><div className="nav-inner">
      <button className="brand" onClick={() => navigate('marketplace')} aria-label="Govisaviya LK home"><span className="brand-mark"><Sprout size={27} strokeWidth={1.7} /></span><span>Govisaviya<span className="brand-lk">LK</span><small>THE LOCAL HARVEST</small></span></button>
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={activeTab === 'marketplace' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('marketplace')} aria-current={activeTab === 'marketplace' ? 'page' : undefined}>Marketplace</button>
        {user ? <button className={activeTab !== 'marketplace' ? 'nav-link active' : 'nav-link'} onClick={() => navigate(user.role === 'farmer' ? 'farmer-dashboard' : 'buyer-dashboard')} aria-current={activeTab !== 'marketplace' ? 'page' : undefined}>{user.role === 'farmer' ? <LayoutDashboard size={17} /> : <ShoppingBag size={17} />}{user.role === 'farmer' ? 'My farm' : 'My reservations'}</button> : <button className="nav-link" onClick={() => goToSection('how-it-works')}>How it works</button>}
        <button className="nav-link impact-link" onClick={() => goToSection('our-purpose')}>Our purpose</button>
      </nav>
      <div className="nav-account">{user ? <><span className="account-name">{user.name}<small>{user.role} · {user.location}</small></span><button className="icon-button" onClick={() => { logout(); setActiveTab('marketplace'); }} aria-label="Log out" title="Log out"><LogOut size={18} /></button></> : <><button className="button button-plain" onClick={() => onOpenAuthModal('login')}>Log in</button><button className="button button-primary" onClick={() => onOpenAuthModal('register')}>Get started</button></>}</div>
    </div></header>
  </>;
}
