import { Sprout, Leaf, MapPin, ShoppingBasket, Handshake, Plus } from 'lucide-react';

export default function SDG2Banner({ stats, onListHarvest }) {
  const metrics = [
    { icon: Sprout, value: stats?.totalFarmers, label: 'Local farmers', note: 'People behind your produce' },
    { icon: ShoppingBasket, value: stats?.totalListings, label: 'Produce listings', note: 'Discover the local harvest' },
    { icon: MapPin, value: stats?.activeLocationsCount, label: 'Growing regions', note: 'Across our island' },
    { icon: Handshake, value: stats?.totalReservations, label: 'Reservations made', note: 'Connecting farms and buyers' },
  ];
  return <section className="market-intro" aria-labelledby="hero-heading">
    <div className="harvest-hero"><div className="hero-copy">
      <span className="eyebrow hero-eyebrow"><Leaf size={15} /> A GOOD HARVEST STARTS HERE</span>
      <h1 id="hero-heading">Fresh from the farm.<br /><em>Closer to home.</em></h1>
      <p>Good food. Fair connections. Discover local produce and connect directly with the farmers who grow it.</p>
      <div className="hero-actions"><a className="button button-white" href="#produce"><ShoppingBasket size={18} /> Explore produce</a><button className="button button-hero-outline" onClick={onListHarvest}><Plus size={18} /> Sell your harvest</button></div>
      <div className="hero-footnote"><span className="small-leaf"><Sprout size={16} /></span> From Sri Lankan soil, with care.</div>
    </div><div className="harvest-note"><span className="harvest-note-icon"><Leaf size={22} /></span><div><strong>Locally grown. Simply better.</strong><span>Support the people who grow your food.</span></div></div></div>
    <div className="impact-metrics" aria-label="Marketplace statistics">{metrics.map(({ icon: Icon, value, label, note }) => <div className="metric" key={label}><span className="metric-icon"><Icon size={22} strokeWidth={1.6} /></span><div><div className="metric-heading"><strong>{value == null ? '—' : Number(value).toLocaleString()}</strong><span>{label}</span></div><small>{note}</small></div></div>)}</div>
  </section>;
}
