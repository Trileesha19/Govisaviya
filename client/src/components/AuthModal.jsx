import { useState } from 'react';
import { X, Sprout, ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const LOCATIONS = ['Nuwara Eliya', 'Dambulla', 'Polonnaruwa', 'Jaffna', 'Anuradhapura', 'Kurunegala', 'Colombo', 'Kandy', 'Galle', 'Badulla', 'Matale', 'Hambantota'];

export default function AuthModal({ initialMode = 'login', initialRole = 'buyer', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [location, setLocation] = useState(initialRole === 'farmer' ? 'Nuwara Eliya' : 'Colombo');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isLogin) {
        await login(email.trim(), password);
        onSuccess('Welcome back. You are signed in.');
      } else {
        await register({ name: name.trim(), email: email.trim(), password, role, location, phone: phone.trim() });
        onSuccess('Your account is ready. Welcome to Govisaviya!');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setMode('login');
    setError('');
  };

  return (
    <Modal title={isLogin ? 'Welcome back to Govisaviya' : 'Join Govisaviya'} onClose={onClose} className="max-w-md">
      <div className="auth-heading">
        <div>
          <span className="auth-brand-icon"><Sprout size={24} /></span>
          <h2 className="font-bold">{isLogin ? 'Welcome back.' : 'Grow with your community.'}</h2>
          <p>{isLogin ? 'Good food. Local people. One connection away.' : 'Connect with local farmers and buyers across Sri Lanka.'}</p>
        </div>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close account dialog"><X size={19} /></button>
      </div>
      <div className="auth-mode-switch" aria-label="Account access">
        <button type="button" aria-pressed={isLogin} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
        <button type="button" aria-pressed={!isLogin} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="shrink-0" size={18} />{error}</div>}
        {!isLogin && <>
          <div>
            <label>I would like to</label>
            <div className="auth-role-options" aria-label="Account type">
              <button type="button" aria-pressed={role === 'buyer'} onClick={() => setRole('buyer')}><ShoppingBag size={19} />Buy produce</button>
              <button type="button" aria-pressed={role === 'farmer'} onClick={() => setRole('farmer')}><Sprout size={19} />Sell my harvest</button>
            </div>
          </div>
          <div><label htmlFor="account-name">Full name</label><input id="account-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" required maxLength={100} /></div>
        </>}
        <div><label htmlFor="account-email">Email address</label><input id="account-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
        <div>
          <label htmlFor="account-password">Password</label>
          <input id="account-password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'} minLength={isLogin ? undefined : 6} required />
        </div>
        {!isLogin && <div className="auth-field-row">
          <div><label htmlFor="account-location">Your location</label><select id="account-location" value={location} onChange={event => setLocation(event.target.value)}>{LOCATIONS.map(item => <option key={item}>{item}</option>)}</select></div>
          <div><label htmlFor="account-phone">Phone (optional)</label><input id="account-phone" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="077 123 4567" /></div>
        </div>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isLogin ? 'Sign in to Govisaviya' : 'Create my account'}</button>
        {isLogin && <details className="auth-demo">
          <summary>Explore with a demo account</summary>
          <p>Choose a sample account to fill the form, then sign in.</p>
          <div>
            <button type="button" onClick={() => fillDemo('farmer.sunil@agri.lk')}>Farmer · Sunil<br />Nuwara Eliya</button>
            <button type="button" onClick={() => fillDemo('farmer.kamal@agri.lk')}>Farmer · Kamal<br />Dambulla</button>
            <button type="button" onClick={() => fillDemo('buyer.supermarket@market.lk')}>Buyer · Lanka Fresh<br />Colombo</button>
            <button type="button" onClick={() => fillDemo('buyer.nimal@market.lk')}>Buyer · Nimal Stores<br />Kandy</button>
          </div>
        </details>}
      </form>
    </Modal>
  );
}
