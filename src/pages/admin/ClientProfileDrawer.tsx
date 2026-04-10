import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Trash2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function ClientProfileDrawer({ client, onClose, onUpdate }: any) {
  const { toast } = useToast();
  
  const [status, setStatus] = useState(client?.status || 'New Lead');
  const [projectType, setProjectType] = useState(client?.project_type || '');
  const [totalValue, setTotalValue] = useState(client?.total_value || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (client) {
      setStatus(client.status);
      setProjectType(client.project_type);
      setTotalValue(client.total_value || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setAddress(client.address || '');
    }
  }, [client]);

  if (!client) return null;

  async function handleSave() {
    setIsSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({
        status,
        project_type: projectType,
        total_value: totalValue ? Number(totalValue) : null,
        email,
        phone,
        address
      })
      .eq('id', client.id);

    setIsSaving(false);
    
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Saved", description: "The CRM pipeline has been updated." });
      onUpdate();
      onClose();
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead Deleted", description: "The pipeline has been cleared." });
      onUpdate();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full p-8 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-space font-bold text-white">{client.first_name} {client.last_name}</h2>
              <p className="text-white/50 text-sm">Created {new Date(client.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Contact Actions */}
          <div className="flex gap-4 mb-8">
            <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors border border-white/5 pointer-events-auto cursor-pointer">
              <Phone size={16} /> <span className="text-sm font-bold">Call Lead</span>
            </a>
            <a href={`mailto:${email}`} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors border border-white/5 pointer-events-auto cursor-pointer">
              <Mail size={16} /> <span className="text-sm font-bold">Email</span>
            </a>
          </div>

          <hr className="border-white/5 mb-8" />

          {/* CRM Editor */}
          <div className="space-y-6">
            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Pipeline Status</label>
               <select 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               >
                 <option value="New Lead">New Lead</option>
                 <option value="Quoted">Quoted / Follow Up</option>
                 <option value="Won">Won / Deposit Paid</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Project Type</label>
               <input 
                 value={projectType} 
                 onChange={(e) => setProjectType(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Email</label>
                 <input 
                   type="email"
                   value={email} 
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Phone</label>
                 <input 
                   type="tel"
                   value={phone} 
                   onChange={(e) => setPhone(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                 />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Property Address</label>
               <input 
                 value={address} 
                 onChange={(e) => setAddress(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               />
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Total Financial Value</label>
               <div className="relative">
                 <span className="absolute left-4 top-3 text-white/50">$</span>
                 <input 
                   type="number"
                   value={totalValue} 
                   onChange={(e) => setTotalValue(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                   placeholder="0.00"
                 />
               </div>
            </div>
            
            <div className="pt-8 flex flex-col gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                <Save size={18} /> {isSaving ? "Saving..." : "Save Profile Changes"}
              </button>

              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm"
              >
                <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Permanently Delete Lead"}
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
