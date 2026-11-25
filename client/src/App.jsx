import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Marketplace from './pages/Marketplace';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AuthModal from './components/AuthModal';
import ReviewModal from './components/ReviewModal';
import FarmerReviewsModal from './components/FarmerReviewsModal';
import ContactFarmerModal from './components/ContactFarmerModal';
import Toast from './components/Toast';
import { Sprout, MapPin } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [authModalMode, setAuthModalMode] = useState(null); // null, 'login', 'register'
  const [authRole, setAuthRole] = useState('buyer');
  const openAuth = (mode, role = 'buyer') => { setAuthRole(role); setAuthModalMode(mode); };
  useEffect(() => { if (!user) setActiveTab('marketplace'); }, [user]);
  
  // Modals State
  const [reviewModalData, setReviewModalData] = useState(null);
  const [farmerReviewsModalData, setFarmerReviewsModalData] = useState(null);
  const [contactFarmerModalData, setContactFarmerModalData] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="app-shell">
      
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={openAuth}
      />

      {/* Main Content Area */}
      <main id="main-content" className="page-container">
        {activeTab === 'marketplace' && (
          <Marketplace
            onShowToast={showToast}
            onOpenAuth={openAuth}
            onOpenWriteReviewModal={(data) => {
              if (!user) {
                showToast('Please log in or register as a Buyer to rate Sri Lankan farmers.', 'error');
                setAuthModalMode('login');
                return;
              }
              if (user.role !== 'buyer') {
                showToast('You are signed in as a Farmer. Only registered buyers can post reviews.', 'error');
                return;
              }
              setReviewModalData(data);
            }}
            onViewFarmerReviewsModal={(farmerId, farmerName) => setFarmerReviewsModalData({ farmerId, farmerName })}
            onOpenContactFarmer={(farmerId, farmerName, listingId, cropName) => {
              if (!user) { setAuthModalMode('login'); return; }
              setContactFarmerModalData({ farmerId, farmerName, listingId, cropName });
            }}
          />
        )}

        {activeTab === 'farmer-dashboard' && user?.role === 'farmer' && (
          <FarmerDashboard onShowToast={showToast} />
        )}

        {activeTab === 'buyer-dashboard' && user?.role === 'buyer' && (
          <BuyerDashboard
            onShowToast={showToast}
            onOpenReviewModal={(data) => setReviewModalData(data)}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner"><div className="footer-brand"><Sprout size={28} /><div><strong>Govisaviya <span>LK</span></strong><p>Good food brings us closer.</p></div></div><div className="footer-links"><MapPin size={16} /><span>Grown in Sri Lanka. Shared with our community.</span></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Govisaviya LK</span><span>Connecting local farmers and buyers · Supporting SDG 2</span></div>
      </footer>
      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          initialRole={authRole}
          onClose={() => setAuthModalMode(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Contact Farmer Modal */}
      {contactFarmerModalData && (
        <ContactFarmerModal
          farmerId={contactFarmerModalData.farmerId}
          farmerName={contactFarmerModalData.farmerName}
          listingId={contactFarmerModalData.listingId}
          cropName={contactFarmerModalData.cropName}
          onClose={() => setContactFarmerModalData(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Review Farmer Modal */}
      {reviewModalData && (
        <ReviewModal
          farmerId={reviewModalData.farmerId}
          farmerName={reviewModalData.farmerName}
          listingId={reviewModalData.listingId}
          cropName={reviewModalData.cropName}
          onClose={() => setReviewModalData(null)}
          onSuccess={(msg) => {
            showToast(msg);
            window.dispatchEvent(new Event('govisaviya_review_submitted'));
          }}
        />
      )}

      {/* Farmer Reviews Drawer/Modal */}
      {farmerReviewsModalData && (
        <FarmerReviewsModal
          farmerId={farmerReviewsModalData.farmerId}
          farmerName={farmerReviewsModalData.farmerName}
          onClose={() => setFarmerReviewsModalData(null)}
          onOpenWriteReview={(targetId, targetName) => {
            const fId = targetId || farmerReviewsModalData?.farmerId;
            const fName = targetName || farmerReviewsModalData?.farmerName;
            setFarmerReviewsModalData(null);
            if (!user) {
              showToast('Please log in or register as a Buyer to rate Sri Lankan farmers.', 'error');
              setAuthModalMode('login');
              return;
            }
            if (user.role !== 'buyer') {
              showToast('You are signed in as a Farmer. Only registered buyers can post reviews.', 'error');
              return;
            }
            setReviewModalData({ farmerId: fId, farmerName: fName });
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
