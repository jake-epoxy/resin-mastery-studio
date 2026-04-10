import { ShoppingCart, ExternalLink, Package } from "lucide-react";

export default function Marketplace() {
  const supplies = [
    { name: "Premium Commercial Polyaspartic - 5 Gallon", price: "$499.00", category: "Topcoats" },
    { name: "Metallic Pigment - Ocean Blue", price: "$24.99", category: "Pigments" },
    { name: "100% Solids Epoxy Basecoat - Clear 15 Gal Kit", price: "$850.00", category: "Resins" },
    { name: "Decorative Vinyl Flake - Nightfall Blend 50lb", price: "$145.00", category: "Flakes" },
    { name: "Industrial Spiked Shoes for Coating", price: "$35.00", category: "Tools" },
    { name: "Notched Squeegee - 18 inch", price: "$28.00", category: "Tools" },
  ];

  return (
    <div className="p-8">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2">Materials Marketplace</h1>
          <p className="text-white/60">Source premium products directly from Mud2Marble at contractor pricing.</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
          Go to Mud2Marble Store <ExternalLink size={18} />
        </button>
      </header>

      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2a1b38] border border-white/10 rounded-3xl p-8 mb-12 flex items-center justify-between">
        <div>
          <span className="text-[#a78bfa] font-bold tracking-wider text-sm mb-2 block uppercase">Current Promotion</span>
          <h2 className="text-3xl font-space font-bold text-white mb-4">Stock up for Spring!</h2>
          <p className="text-white/70 max-w-md">Get 15% off all 15-gallon bulk epoxy kits. Use code <span className="text-white font-bold bg-white/10 px-2 py-1 rounded">SPRING15</span> at checkout.</p>
        </div>
        <div className="hidden md:flex p-6 bg-white/5 rounded-full border border-white/10 relative">
           <Package size={64} className="text-[#a78bfa]" />
        </div>
      </div>

      <h3 className="text-xl font-space font-bold text-white mb-6">Popular Materials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplies.map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/30 cursor-pointer transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-square bg-[#0a0a0a] rounded-xl mb-4 border border-white/5 flex items-center justify-center relative overflow-hidden">
                <Package size={48} className="text-white/10" />
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {item.category}
                </div>
              </div>
              <h4 className="font-bold text-md text-white mb-2 leading-tight">{item.name}</h4>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-xl font-space font-bold text-[#78c8ff]">{item.price}</span>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <ShoppingCart size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
