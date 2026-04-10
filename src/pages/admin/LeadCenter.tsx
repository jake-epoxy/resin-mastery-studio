import { useState, useEffect } from "react";
import { Search, UserPlus, Phone, Mail, FileText, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import ClientProfileDrawer from "./ClientProfileDrawer";
import AddLeadModal from "./AddLeadModal";
import { Link } from "react-router-dom";

export default function LeadCenter() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('installer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  }

  const filteredClients = clients.filter(c => {
    const search = searchQuery.toLowerCase();
    return (
      (c.first_name + " " + c.last_name).toLowerCase().includes(search) ||
      (c.email || "").toLowerCase().includes(search) ||
      (c.phone || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-8 pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2">Lead Center</h1>
          <p className="text-white/60">Search and manage your entire rolodex of contacts.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-[#78c8ff] text-black px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors whitespace-nowrap">
          <UserPlus size={18} /> New Contact
        </button>
      </header>

      {/* Global Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, email, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
        />
      </div>

      {/* Contacts Data Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-bold">Client Name</th>
                <th className="p-4 font-bold">Contact Info</th>
                <th className="p-4 font-bold">Service Requested</th>
                <th className="p-4 font-bold">Pipeline Status</th>
                <th className="p-4 font-bold text-right pt-6 pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/50">Decrypting Rolodex...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/50">No contacts found matching "{searchQuery}"</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="p-4 align-top">
                      <div className="font-bold text-white group-hover:text-[#78c8ff] transition-colors">{client.first_name} {client.last_name}</div>
                      <div className="text-xs text-white/40 font-mono mt-1">Added {new Date(client.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-sm text-white/70 mb-1"><Phone size={14} className="text-white/30" /> {client.phone || '-'}</div>
                      <div className="flex items-center gap-2 text-sm text-white/70"><Mail size={14} className="text-white/30" /> {client.email || '-'}</div>
                    </td>
                    <td className="p-4 align-top text-sm text-white/80">
                      {client.project_type || 'Unknown Service'}
                    </td>
                    <td className="p-4 align-top">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${
                        client.status === 'New Lead' ? 'bg-[#78c8ff]/10 text-[#78c8ff] border-[#78c8ff]/20' : 
                        client.status === 'Quoted' ? 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20' : 
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4 align-top text-right">
                      <Link 
                        to="/admin/quote" 
                        onClick={(e) => e.stopPropagation()} // Prevent opening drawer when trying to quote
                        className="inline-flex items-center gap-2 text-xs font-bold bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FileText size={14} /> Send Quote
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <ClientProfileDrawer 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onUpdate={fetchClients} 
        />
      )}

      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={fetchClients} 
      />
    </div>
  );
}
