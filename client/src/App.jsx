import React, { useState } from 'react';
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
import { Sprout, Heart, ShieldCheck, Globe, MapPin } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [authModalMode, setAuthModalMode] = useState(null); // null, 'login', 'register'
  
  // Modals State
  const [reviewModalData, setReviewModalData] = useState(null);
  const [farmerReviewsModalData, setFarmerReviewsModalData] = useState(null);
  const [contactFarmerModalData, setContactFarmerModalData] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={(mode) => setAuthModalMode(mode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'marketplace' && (
          <Marketplace
            onShowToast={showToast}
            onOpenAuth={(mode) => setAuthModalMode(mode)}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white font-outfit">
                  Govisaviya <span className="text-emerald-400">LK</span>
                </span>
                <p className="text-xs text-slate-400">UN SDG 2 Zero Hunger — Sri Lanka Local Produce Platform</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Nuwara Eliya • Dambulla • Polonnaruwa • Jaffna • Anuradhapura</span>
              </span>
            </div>

          </div>

          <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>© 2026 Local Farmer-to-Buyer Marketplace. Direct & Fair Trade.</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <span>Supporting Sri Lankan Agriculture & Food Security</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
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
