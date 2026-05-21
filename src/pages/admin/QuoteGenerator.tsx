import { useState, useEffect } from "react";
import { Calculator, ExternalLink, ShieldCheck, CreditCard, Link as LinkIcon, Palette, FileText, Save, UploadCloud, RotateCcw, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_TERMS = `A 50% non-refundable material deposit is required before scheduling.
Floor must be completely cleared of all items prior to the installation team's arrival.
Custom flake and metallic variations are artistic processes; exact uniform matching cannot be guaranteed.
Balance is strictly due upon project completion.`;

export default function QuoteGenerator() {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [serviceType, setServiceType] = useState("Premium Residential Flake System");
  
  const [sqft, setSqft] = useState(500);
  const [documentMode, setDocumentMode] = useState<'quote' | 'pitch'>('quote');
  const [pricePerSqft, setPricePerSqft] = useState(6.50);
  
  const [pricingMode, setPricingMode] = useState<"sqft" | "flat">("sqft");
  const [flatRate, setFlatRate] = useState(2500);
  
  // Profile Baseline Pricing
  const [baseFlakePrice, setBaseFlakePrice] = useState(6.50);
  const [baseMetallicPrice, setBaseMetallicPrice] = useState(8.50);
  const [financingLink, setFinancingLink] = useState('');
  const [offerFinancing, setOfferFinancing] = useState(false);
  const [profileServicePricing, setProfileServicePricing] = useState<Record<string, number>>({});
  
  // Customization State (Sticky)
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('resinos_theme') || "#78c8ff");
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('resinos_logo') || "");
  const [contractPdfUrl, setContractPdfUrl] = useState(() => localStorage.getItem('resinos_pdf') || "");
  const [brandName, setBrandName] = useState(() => localStorage.getItem('resinos_brand') || "Epoxy Contractor");
  const [legalTerms, setLegalTerms] = useState(() => localStorage.getItem('resinos_terms') || DEFAULT_TERMS);
  
  useEffect(() => { localStorage.setItem('resinos_theme', themeColor); }, [themeColor]);
  useEffect(() => { localStorage.setItem('resinos_brand', brandName); }, [brandName]);
  useEffect(() => { localStorage.setItem('resinos_terms', legalTerms); }, [legalTerms]);
  
  // Uploading States
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const [isUploadingMockup, setIsUploadingMockup] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [saveTemplateName, setSaveTemplateName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedQuoteId, setGeneratedQuoteId] = useState("");
  const [installerEmail, setInstallerEmail] = useState("");
  
  const [isSendingToClient, setIsSendingToClient] = useState(false);
  const [clientEmailed, setClientEmailed] = useState(false);
  const [visualizationImage, setVisualizationImage] = useState<string | null>(() => localStorage.getItem('resinos_viz') || null);

  useEffect(() => { 
    if (visualizationImage) localStorage.setItem('resinos_viz', visualizationImage); 
    else localStorage.removeItem('resinos_viz');
  }, [visualizationImage]);

  // Payment Schedule State
  type Milestone = { label: string; pct: number };
  const SCHEDULE_PRESETS: Record<string, { name: string; emoji: string; desc: string; milestones: Milestone[] }> = {
    '50_50': {
      name: '50 / 50',
      emoji: '⚖️',
      desc: '50% deposit, balance on completion',
      milestones: [
        { label: 'Material Deposit', pct: 50 },
        { label: 'Balance Due on Completion', pct: 50 },
      ]
    },
    '100_upfront': {
      name: '100% Upfront',
      emoji: '💰',
      desc: 'Full payment before work begins',
      milestones: [
        { label: 'Full Payment Before Start', pct: 100 },
      ]
    },
    'staggered': {
      name: '20 / 40 / 40',
      emoji: '📊',
      desc: '20% deposit, 40% at start, 40% on completion',
      milestones: [
        { label: 'Booking Deposit', pct: 20 },
        { label: 'Due When Work Begins', pct: 40 },
        { label: 'Balance Due on Completion', pct: 40 },
      ]
    },
    'custom': {
      name: 'Custom',
      emoji: '✏️',
      desc: 'Build your own payment milestones',
      milestones: [
        { label: 'Deposit', pct: 30 },
        { label: 'Mid-Project', pct: 30 },
        { label: 'Final Balance', pct: 40 },
      ]
    },
  };
  const [scheduleType, setScheduleType] = useState<string>('50_50');
  const [customMilestones, setCustomMilestones] = useState<Milestone[]>(SCHEDULE_PRESETS['custom'].milestones);

  // Check for visualization from AI Visualizer (supports both localStorage and sessionStorage)
  useEffect(() => {
    const viz = sessionStorage.getItem('viz_image') || localStorage.getItem('resinos_visualization');
    if (viz) {
      setVisualizationImage(viz);
      // Read style/color info if available
      const vizStyle = sessionStorage.getItem('viz_style');
      const vizColor = sessionStorage.getItem('viz_color');
      if (vizStyle && vizColor) {
        setServiceType(`${vizStyle} — ${vizColor}`);
      }
    }
  }, []);

  // Check for Autopilot Lead integration to auto-create client profile
  useEffect(() => {
    const autopilotName = sessionStorage.getItem('autopilot_client_name');
    if (autopilotName) {
      setDocumentMode('pitch');
      const fetchAndCreate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if client with similar company/first name already exists in db
        const { data: existing } = await supabase
          .from('clients')
          .select('*')
          .eq('installer_id', user.id)
          .eq('first_name', autopilotName)
          .limit(1);

        if (existing && existing.length > 0) {
          // If already exists, just select it
          setSelectedClientId(existing[0].id);
        } else {
          // Create a new client!
          const phone = sessionStorage.getItem('autopilot_client_phone') || null;
          const address = sessionStorage.getItem('autopilot_client_address') || null;
          const website = sessionStorage.getItem('autopilot_client_website') || null;
          
          let scrapedEmail = null;
          if (website) {
            try {
              toast({ title: "Scanning website...", description: "Looking for client's email address on their site." });
              const res = await fetch('/api/scrape-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: website })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.email) scrapedEmail = data.email;
              }
            } catch (err) {
              console.error("Failed to scrape email:", err);
            }
          }
          
          const { data: created, error } = await supabase
            .from('clients')
            .insert([{
              installer_id: user.id,
              first_name: autopilotName,
              last_name: "(Lead)",
              phone,
              email: scrapedEmail,
              address,
              project_type: serviceType || "Autopilot Pitch",
              status: "New Lead"
            }])
            .select()
            .single();

          if (!error && created) {
            // Update clients list state and select it
            setClients(prev => [created, ...prev]);
            setSelectedClientId(created.id);
            toast({
              title: "Lead Profile Created",
              description: `Imported ${autopilotName} from Autopilot to your CRM.`
            });
          }
        }
        
        // Clean up sessionStorage autopilot info so it doesn't run again on reload
        sessionStorage.removeItem('autopilot_client_name');
        sessionStorage.removeItem('autopilot_client_phone');
        sessionStorage.removeItem('autopilot_client_address');
        sessionStorage.removeItem('autopilot_client_website');
      };

      fetchAndCreate();
    }
  }, [clients]);

  async function handleSendToClient() {
    setIsSendingToClient(true);
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client || !client.email) {
      toast({ title: "No client email found", variant: "destructive" });
      setIsSendingToClient(false);
      return;
    }

    try {
      await fetch('/api/send-email', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: client.email,
            cc: installerEmail,
            subject: `Your Custom Quote from ${brandName}`,
            html: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoUrl ? '<img src="' + logoUrl + '" alt="' + brandName + '" style="max-height: 60px; border-radius: 8px; margin-bottom: 20px;" />' : ''}
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: -0.5px;">Your Custom Quote</h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 16px;">Prepared exclusively for ${client.first_name || 'you'}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Project Total</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: ${themeColor};">$${estimatedTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">${serviceType || 'Premium Installation'}</p>
              </div>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for trusting <strong>${brandName}</strong> with your project. We've prepared a highly detailed, interactive proposal for your review.</p>
              <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">Click the secure link below to view your full project breakdown, material details, and to digitally sign your agreement when you are ready to proceed.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${generatedLink}" style="background-color: ${themeColor}; color: #000000; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">View Interactive Quote &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated message from <strong>${brandName}</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
        })
      });
      
      if (generatedQuoteId) {
        await supabase.from('quotes').update({ status: 'Sent' }).eq('id', generatedQuoteId);
      }
      
      setClientEmailed(true);
      toast({ title: "Quote Sent Successfully!", description: "Check your email for your CC receipt." });
      
      // Auto-refresh the form so the user can move on to the next quote
      setTimeout(() => {
        handleReset();
      }, 3500);
      
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    }
    setIsSendingToClient(false);
  }

  const estimatedTotal = pricingMode === 'sqft' ? (sqft * pricePerSqft) : flatRate;
  const estimatedMaterial = pricingMode === 'sqft' ? (sqft * 1.50) : (flatRate * 0.15); 
  const margin = estimatedTotal - estimatedMaterial;

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setInstallerEmail(user.email || "Notification");

    const { data: clientsData } = await supabase.from('clients').select('*').eq('installer_id', user.id).order('created_at', { ascending: false });
    if (clientsData) setClients(clientsData);

    const { data: templatesData } = await supabase.from('quote_templates').select('*').eq('installer_id', user.id).order('created_at', { ascending: false });
    if (templatesData) setTemplates(templatesData);
    
    // Fetch base pricing profile
    const { data: profile } = await supabase.from('installer_profiles').select('*').eq('user_id', user.id).single();
    if (profile) {
      if (profile.base_flake_price) {
          setBaseFlakePrice(profile.base_flake_price);
          setPricePerSqft(profile.base_flake_price);
      }
      if (profile.base_metallic_price) {
          setBaseMetallicPrice(profile.base_metallic_price);
      }
      if (profile.service_pricing) {
        setProfileServicePricing(profile.service_pricing);
        // Check if autopilot passed a specific style to override default pricing
        const vizStyle = sessionStorage.getItem('viz_style')?.toLowerCase() || "";
        let matchedKey = Object.keys(profile.service_pricing)[0]; // default to first

        if (vizStyle.includes('flake')) matchedKey = 'flake';
        else if (vizStyle.includes('metallic') || vizStyle.includes('marble')) matchedKey = 'metallic';
        else if (vizStyle.includes('quartz')) matchedKey = 'quartz';
        else if (vizStyle.includes('solid')) matchedKey = 'single_color';
        else if (vizStyle.includes('polish')) matchedKey = 'polishing';

        if (matchedKey && profile.service_pricing[matchedKey]) {
           setPricePerSqft(profile.service_pricing[matchedKey]);
        } else if (Object.keys(profile.service_pricing)[0]) {
           setPricePerSqft(profile.service_pricing[Object.keys(profile.service_pricing)[0]]);
        }
      }
      if (profile.company_name) {
        setBrandName(profile.company_name);
        localStorage.setItem('resinos_brand', profile.company_name);
      }
      if (profile.company_logo_url && !logoUrl) setLogoUrl(profile.company_logo_url);
    } else if (user?.email && (!localStorage.getItem('resinos_brand') || localStorage.getItem('resinos_brand') === "Epoxy Contractor")) {
      setBrandName(user.email.split('@')[0].toUpperCase());
    }

    // Clean up autopilot session storage after initialization
    sessionStorage.removeItem('viz_image');
    sessionStorage.removeItem('viz_style');
    sessionStorage.removeItem('viz_color');
    localStorage.removeItem('resinos_visualization');
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setThemeColor("#78c8ff");
      setLogoUrl("");
      setContractPdfUrl("");
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setThemeColor(template.theme_color || "#78c8ff");
      setLogoUrl(template.logo_url || "");
      setContractPdfUrl(template.contract_pdf_url || "");
      if (template.legal_terms) setLegalTerms(template.legal_terms);
    }
  }

  async function uploadFileToSupabase(file: File, folder: 'logos' | 'contracts' | 'mockups') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    toast({ title: `Uploading ${folder === 'logos' ? 'Logo' : 'Contract'}...` });

    const { error: uploadError } = await supabase.storage
      .from('business-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;
     setIsUploadingLogo(true);
     const url = await uploadFileToSupabase(file, 'logos');
     if (url) {
       setLogoUrl(url);
       localStorage.setItem('resinos_logo', url);
       toast({ title: "Logo Uploaded!" });
     }
     setIsUploadingLogo(false);
  }

  async function handleMockupUpload(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;
     setIsUploadingMockup(true);
     const url = await uploadFileToSupabase(file, 'mockups');
     if (url) {
       setVisualizationImage(url);
       toast({ title: "Mockup Photo Uploaded!" });
     }
     setIsUploadingMockup(false);
  }

  async function handleContractUpload(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;
     setIsUploadingContract(true);
     const url = await uploadFileToSupabase(file, 'contracts');
     if (url) {
       setContractPdfUrl(url);
       localStorage.setItem('resinos_pdf', url);
       toast({ title: "Custom PDF Contract Uploaded!" });
     }
     setIsUploadingContract(false);
  }

  async function handleSaveTemplate() {
    if (!saveTemplateName) {
      toast({ title: "Template Name Required", variant: "destructive" });
      return;
    }
    setIsSavingTemplate(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('quote_templates')
      .insert([{
        installer_id: user.id,
        name: saveTemplateName,
        theme_color: themeColor,
        logo_url: logoUrl,
        contract_pdf_url: contractPdfUrl,
        legal_terms: legalTerms
      }])
      .select()
      .single();

    if (!error && data) {
      setTemplates([data, ...templates]);
      setSelectedTemplateId(data.id);
      setSaveTemplateName("");
      toast({ title: "Template Saved Successfully!" });
    } else {
      toast({ title: "Error saving template", description: error?.message, variant: "destructive" });
    }
    setIsSavingTemplate(false);
  }

  async function handleGenerateQuote() {
    if (!selectedClientId) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }
    setIsGenerating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const activeMilestones = scheduleType === 'custom' ? customMilestones : SCHEDULE_PRESETS[scheduleType].milestones;
    const firstPct = activeMilestones[0]?.pct || 50;

    const configPayload = {
      document_mode: documentMode,
      theme_color: themeColor,
      brand_name: brandName,
      logo_url: logoUrl,
      contract_pdf_url: contractPdfUrl,
      legal_terms: legalTerms,
      service_type: serviceType,
      visualization_image: visualizationImage,
      deposit_pct: firstPct,
      payment_schedule: {
        type: scheduleType,
        milestones: activeMilestones
      }
    };

    const { data: quote, error } = await supabase
      .from('quotes')
      .insert([{
        installer_id: user.id,
        installer_email: user.email,
        client_id: selectedClientId,
        total_amount: estimatedTotal,
        sqft: sqft,
        financing_link: offerFinancing && financingLink ? financingLink : null,
        config: configPayload,
        status: 'Draft' 
      }])
      .select()
      .single();

    if (error || !quote) {
      toast({ title: "Error Generating Quote", description: error?.message, variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    const smartLink = `${window.location.origin}/quote-live/${quote.id}`;
    setGeneratedLink(smartLink);
    setGeneratedQuoteId(quote.id);
    
    await supabase.from('clients')
      .update({ status: 'Quoted', total_value: estimatedTotal, project_type: serviceType })
      .eq('id', selectedClientId);

    toast({ title: "Smart Link Generated" });

    const emailSubject = documentMode === 'quote' ? 'Link Ready: Smart Quote Generated' : 'Link Ready: Vision Pitch Generated';
    const emailHeader = documentMode === 'quote' ? 'Secure Link Ready' : 'Vision Pitch Ready';
    
    await fetch('/api/send-email', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          to: installerEmail,
          subject: emailSubject,
          html: `<div style="font-family:sans-serif;padding:20px;border-radius:10px;border:1px solid #eee;">
                  <h2>${emailHeader}</h2>
                  <a href="${smartLink}">${smartLink}</a>
                 </div>`
      })
    });

    setIsGenerating(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
    toast({ title: "Copied to Clipboard!" });
  }

  const activeClientName = clients.find(c => c.id === selectedClientId)?.first_name || "John";
  const activeClientLast = clients.find(c => c.id === selectedClientId)?.last_name || "Doe";

  function handleReset() {
    localStorage.removeItem('resinos_theme');
    localStorage.removeItem('resinos_terms');
    localStorage.removeItem('resinos_logo');
    localStorage.removeItem('resinos_pdf');
    localStorage.removeItem('resinos_viz');
    
    setThemeColor("#78c8ff");
    setLegalTerms(DEFAULT_TERMS);
    setLogoUrl("");
    setContractPdfUrl("");
    setVisualizationImage(null);
    setSelectedTemplateId("");
    setSelectedClientId("");
    setSqft(500);
    setOfferFinancing(false);
    setFinancingLink("");
    setGeneratedLink("");
    setGeneratedQuoteId("");
    toast({ title: "Form Reset!" });
  }

  return (
    <div className="p-4 md:p-8 pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2">
            {documentMode === 'quote' ? 'Quote Generator Studio' : 'Vision Pitch Studio'}
          </h1>
          <p className="text-white/60 mb-6">
            {documentMode === 'quote' 
              ? 'Generate branded live contracts featuring your own custom PDF agreements.'
              : 'Generate highly visual pitch decks designed for cold outreach and high-end leads.'}
          </p>
          
          <div className="inline-flex bg-black/50 border border-white/10 rounded-xl p-1 mb-2 shadow-inner">
            <button 
              onClick={() => setDocumentMode('quote')}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${documentMode === 'quote' ? 'bg-[#a78bfa] text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
            >
              Binding Quote
            </button>
            <button 
              onClick={() => setDocumentMode('pitch')}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${documentMode === 'pitch' ? 'bg-[#a78bfa] text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
            >
              Vision Pitch
            </button>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors text-sm font-bold"
        >
          <RotateCcw size={14} /> Start Fresh
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Col: Controls */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Section 1: Template Manager */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-space font-bold text-white flex items-center gap-2 mb-6">
              <Palette size={18} className="text-[#a78bfa]"/> Branding & Native Contracts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Load Template</label>
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] appearance-none"
                  >
                    <option value="">-- Start Fresh --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Company Display Name</label>
                  <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#a78bfa]" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Brand Accent Color</label>
                  <div className="flex items-center gap-4">
                     <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0" />
                     <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none" />
                  </div>
                </div>

                {/* Upload Logo Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Company Logo</label>
                  <div className={`border-2 border-dashed ${logoUrl ? 'border-transparent bg-white/5' : 'border-white/20 hover:bg-white/5'} rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors relative`}>
                     {isUploadingLogo ? (
                        <p className="text-sm font-bold text-white">Uploading...</p>
                     ) : logoUrl ? (
                        <div className="flex flex-col items-center gap-3 relative z-10">
                          <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-xl" />
                          <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              setLogoUrl(""); 
                              localStorage.removeItem('resinos_logo');
                            }}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs px-4 py-1.5 rounded-full transition-colors font-bold"
                          >
                            Remove Logo
                          </button>
                        </div>
                     ) : (
                        <>
                          <UploadCloud className="text-white/40" />
                          <p className="text-sm font-bold text-white/70">Click to upload Avatar</p>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                     )}
                  </div>
                </div>
              </div>

              {/* Native PDF Contract Upload */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Upload Native PDF Contract (Optional)</label>
                  <div className={`border-2 border-dashed ${contractPdfUrl ? 'border-[#a78bfa]/50 bg-[#a78bfa]/5' : 'border-white/20 hover:bg-white/5'} rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors relative`}>
                      {isUploadingContract ? (
                          <p className="text-sm font-bold text-white">Uploading Contract securely...</p>
                      ) : contractPdfUrl ? (
                          <>
                            <FileText className="text-[#a78bfa]" size={32} />
                            <p className="text-sm font-bold text-white text-center">Custom PDF Active</p>
                            <p className="text-[10px] text-white/40 font-mono text-center">We will embed this document and append signatures to it natively.</p>
                          </>
                      ) : (
                        <>
                          <FileText className="text-white/40" size={32} />
                          <p className="text-sm font-bold text-white/70">Upload your own .PDF Contract</p>
                          <p className="text-[10px] text-white/40 font-mono text-center">Leave blank to use dynamic system generation.</p>
                        </>
                      )}
                      <input type="file" accept="application/pdf" onChange={handleContractUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                {!contractPdfUrl && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Dynamic Terms (If No PDF Uploaded)</label>
                    <textarea 
                      value={legalTerms}
                      onChange={(e) => setLegalTerms(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a78bfa] h-32 resize-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Template Action */}
            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center gap-4">
               <input 
                 value={saveTemplateName}
                 onChange={e => setSaveTemplateName(e.target.value)}
                 placeholder="Name this workflow (e.g. Masterclass Standard)"
                 className="w-full md:w-2/3 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
               />
               <button onClick={handleSaveTemplate} disabled={isSavingTemplate || !saveTemplateName} className="w-full md:w-1/3 bg-white/10 text-white hover:bg-white/20 transition-colors font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2">
                 <Save size={16} /> {isSavingTemplate ? "Saving..." : "Save Template"}
               </button>
            </div>
          </div>

          {/* Section 2: Estimator */}
          {documentMode === 'quote' && (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-lg font-space font-bold text-white flex items-center justify-between gap-2 mb-6 z-10 relative">
              <span className="flex items-center gap-2"><Calculator size={18} className="text-[#a78bfa]" /> Pricing Engine</span>
              <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
                <button type="button" onClick={() => setPricingMode("sqft")} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${pricingMode === "sqft" ? "bg-[#a78bfa] text-white" : "text-white/50 hover:text-white"}`}>By Sq Ft</button>
                <button type="button" onClick={() => setPricingMode("flat")} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${pricingMode === "flat" ? "bg-[#a78bfa] text-white" : "text-white/50 hover:text-white"}`}>Flat Rate</button>
              </div>
            </h2>

            {pricingMode === "sqft" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Project Square Footage</label>
                  <input type="number" value={sqft} onChange={(e) => setSqft(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-[#a78bfa]" />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50">Price Per Sq Ft</label>
                  </div>
                  {/* Dynamic service pricing buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Object.keys(profileServicePricing).length > 0 ? (
                      Object.entries(profileServicePricing).map(([key, price]) => {
                        const labels: Record<string, string> = {
                          flake: 'Flake', metallic: 'Metallic', quartz: 'Quartz',
                          grind_seal: 'Grind&Seal', polishing: 'Polish',
                          single_color: 'Solid', countertops: 'Counter'
                        };
                        const serviceNames: Record<string, string> = {
                          flake: 'Premium Flake System', metallic: 'Metallic Epoxy System',
                          quartz: 'Quartz Broadcast System', grind_seal: 'Grind & Seal',
                          polishing: 'Concrete Polishing', single_color: 'Single Color Epoxy',
                          countertops: 'Epoxy Countertops'
                        };
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setPricePerSqft(price); setServiceType(serviceNames[key] || key); }}
                            className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold tracking-wider border transition-colors ${
                              pricePerSqft === price
                                ? 'bg-[#78c8ff]/20 text-[#78c8ff] border-[#78c8ff]/40'
                                : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/5'
                            }`}
                          >
                            {labels[key] || key} (${price})
                          </button>
                        );
                      })
                    ) : (
                      <>
                        <button type="button" onClick={() => { setPricePerSqft(baseFlakePrice); setServiceType("Premium Flake System"); }} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/70 transition-colors uppercase font-bold tracking-wider border border-white/5">
                          Flake (${baseFlakePrice})
                        </button>
                        <button type="button" onClick={() => { setPricePerSqft(baseMetallicPrice); setServiceType("Metallic Epoxy System"); }} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/70 transition-colors uppercase font-bold tracking-wider border border-white/5">
                          Metallic (${baseMetallicPrice})
                        </button>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input type="number" step="0.10" value={pricePerSqft} onChange={(e) => setPricePerSqft(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-lg focus:outline-none focus:border-[#a78bfa]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 max-w-md">
                 <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Total Flat-Rate Project Price</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                   <input type="number" value={flatRate} onChange={(e) => setFlatRate(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#a78bfa]" />
                 </div>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between relative z-10">
               <div>
                 <span className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Gross Margin Estimate</span>
                 <span className="text-xl font-bold text-green-400">${margin.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               <div className="text-right">
                 <span className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Total Quote Output</span>
                 <span className="text-2xl font-space font-bold text-white" style={{color: themeColor}}>${estimatedTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
            </div>
          </div>
        )}

          {/* Section 3: Final Generation */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-space font-bold text-white flex items-center gap-2 mb-6">
              <ShieldCheck size={18} className="text-[#a78bfa]"/> Issue Smart Contract
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Select Pipeline Client</label>
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] appearance-none">
                  <option value="">-- Choose active lead --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.project_type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Service Description</label>
                <input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="500sqft Metallic Epoxy" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] mb-4" />
                
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Attach Project Photo / Mockup (Optional)</label>
                <div className={`border border-dashed ${visualizationImage ? 'border-transparent bg-white/5' : 'border-white/20 hover:bg-white/5'} rounded-xl p-3 flex items-center justify-between transition-colors relative`}>
                    {isUploadingMockup ? (
                      <p className="text-xs font-bold text-white pl-2">Uploading...</p>
                    ) : visualizationImage ? (
                      <div className="flex items-center gap-3 relative z-10 w-full justify-between">
                        <div className="flex items-center gap-2">
                          <img src={visualizationImage} alt="Mockup" className="w-10 h-10 rounded object-cover border border-white/10" />
                          <span className="text-xs font-bold text-white">Mockup Attached</span>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); setVisualizationImage(null); }}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] px-3 py-1.5 rounded transition-colors font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 pl-2">
                          <UploadCloud className="text-white/40" size={16} />
                          <p className="text-xs font-bold text-white/70">Click or Drop Image</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleMockupUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </>
                    )}
                </div>
              </div>
            </div>

            {documentMode === 'quote' && (
              <>
                <div className="mb-6 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                   <div className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded" onClick={() => setOfferFinancing(!offerFinancing)}>
                     <div>
                       <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2"><CreditCard className="text-[#a78bfa]" size={16}/> Offer Financing</h4>
                     </div>
                     <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${offerFinancing ? 'bg-[#a78bfa]' : 'bg-white/20'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-transform ${offerFinancing ? 'translate-x-6' : 'translate-x-0'}`} style={offerFinancing ? {backgroundColor: themeColor} : {}} />
                     </div>
                   </div>
                   {offerFinancing && (
                     <div className="pt-2 border-t border-white/10">
                       <input type="url" value={financingLink} onChange={(e) => setFinancingLink(e.target.value)} placeholder="Paste Financing URL" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none" />
                     </div>
                   )}
                </div>

                {/* Payment Schedule Selector */}
                <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Payment Schedule</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Object.entries(SCHEDULE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setScheduleType(key)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      scheduleType === key
                        ? 'border-[#a78bfa] bg-[#a78bfa]/10 shadow-[0_0_15px_rgba(167,139,250,0.15)]'
                        : 'border-white/10 bg-black/30 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg block mb-1">{preset.emoji}</span>
                    <p className={`font-bold text-sm ${scheduleType === key ? 'text-white' : 'text-white/60'}`}>{preset.name}</p>
                    <p className="text-[9px] text-white/30 leading-tight mt-0.5">{preset.desc}</p>
                  </button>
                ))}
              </div>

              {/* Visual payment breakdown preview */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#a78bfa]"></div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Payment Breakdown — ${estimatedTotal.toLocaleString()}</p>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
                  {(scheduleType === 'custom' ? customMilestones : SCHEDULE_PRESETS[scheduleType].milestones).map((m, i) => {
                    const colors = ['#a78bfa', '#78c8ff', '#34d399', '#fbbf24'];
                    return <div key={i} style={{ width: `${m.pct}%`, backgroundColor: colors[i % colors.length] }} className="rounded-full transition-all" />;
                  })}
                </div>
                <div className="space-y-2">
                  {(scheduleType === 'custom' ? customMilestones : SCHEDULE_PRESETS[scheduleType].milestones).map((m, i) => {
                    const colors = ['#a78bfa', '#78c8ff', '#34d399', '#fbbf24'];
                    const amount = estimatedTotal * (m.pct / 100);
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
                          {scheduleType === 'custom' ? (
                            <input
                              value={m.label}
                              onChange={(e) => {
                                const updated = [...customMilestones];
                                updated[i] = { ...updated[i], label: e.target.value };
                                setCustomMilestones(updated);
                              }}
                              className="bg-transparent border-b border-white/10 text-white/80 text-xs focus:outline-none focus:border-[#a78bfa] w-36 py-0.5"
                            />
                          ) : (
                            <span className="text-white/60">{m.label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {scheduleType === 'custom' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1" max="100"
                                value={m.pct}
                                onChange={(e) => {
                                  const updated = [...customMilestones];
                                  updated[i] = { ...updated[i], pct: Number(e.target.value) };
                                  setCustomMilestones(updated);
                                }}
                                className="w-12 bg-transparent border-b border-white/10 text-white text-xs text-right focus:outline-none focus:border-[#a78bfa] py-0.5"
                              />
                              <span className="text-white/30">%</span>
                            </div>
                          ) : (
                            <span className="text-white/40">{m.pct}%</span>
                          )}
                          <span className="font-mono font-bold text-white">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {scheduleType === 'custom' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setCustomMilestones([...customMilestones, { label: 'New Milestone', pct: 10 }])}
                      className="text-[10px] bg-white/5 hover:bg-white/10 text-white/50 px-3 py-1.5 rounded-lg border border-white/10 transition-colors font-bold"
                    >
                      + Add Milestone
                    </button>
                    {customMilestones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setCustomMilestones(customMilestones.slice(0, -1))}
                        className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors font-bold"
                      >
                        Remove Last
                      </button>
                    )}
                    {(() => {
                      const total = customMilestones.reduce((a, m) => a + m.pct, 0);
                      if (total !== 100) return <span className="text-red-400 text-[10px] font-bold self-center ml-auto">⚠️ Total: {total}% (must equal 100%)</span>;
                      return <span className="text-emerald-400 text-[10px] font-bold self-center ml-auto">✅ 100%</span>;
                    })()}
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {!generatedLink ? (
              <button 
                disabled={!selectedClientId || isGenerating}
                onClick={handleGenerateQuote}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor, color: '#000' }}
              >
                {isGenerating ? "Securing Payload..." : "Generate Custom Live Link"}
                <ExternalLink size={18} color="#000" />
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-white/5 border border-white/20 rounded-xl">
                <p className="text-sm font-bold text-green-400">Smart Link Ready!</p>                 
                <div className="flex border border-white/20 rounded-lg overflow-hidden bg-black/50 mb-4">
                  <div className="px-3 flex items-center text-white/40 border-r border-white/10"><LinkIcon size={14} /></div>
                  <input readOnly value={generatedLink} className="w-full bg-transparent p-3 text-sm focus:outline-none" style={{color: themeColor}} />
                  <button onClick={copyLink} className="px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors flex items-center gap-2">Copy</button>
                </div>
                
                {/* Send to Client Email UI */}
                {/* Send to Client Email UI */}
                {(() => {
                  const client = clients.find(c => c.id === selectedClientId);
                  if (clientEmailed) {
                    return <div className="text-green-400 text-sm font-bold flex items-center justify-center gap-2 border-t border-white/10 pt-4"><ShieldCheck size={16}/> Sent to Client!</div>;
                  }
                  
                  return (
                    <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                      {!client?.email && (
                        <p className="text-white/40 text-xs text-center mb-1">No email on file. Enter one to send directly:</p>
                      )}
                      
                      {/* Temporary override email state */}
                      <input 
                         id="overrideEmailInput"
                         type="email" 
                         defaultValue={client?.email || ""}
                         placeholder="client@example.com" 
                         className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a78bfa] text-center"
                      />

                      <button 
                        onClick={async () => {
                          const inputVal = (document.getElementById('overrideEmailInput') as HTMLInputElement).value;
                          if (!inputVal) return;
                          setIsSendingToClient(true);
                          try {
                            await fetch('/api/send-email', {
                              method: "POST",
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                  to: inputVal,
                                  subject: `Your Custom Quote from ${brandName}`,
                                  html: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoUrl ? '<img src="' + logoUrl + '" alt="' + brandName + '" style="max-height: 60px; border-radius: 8px; margin-bottom: 20px;" />' : ''}
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: -0.5px;">Your Custom Quote</h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 16px;">Prepared exclusively for ${client?.first_name || 'you'}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">Project Total</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: ${themeColor};">$${estimatedTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">${serviceType || 'Premium Installation'}</p>
              </div>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for trusting <strong>${brandName}</strong> with your project. We've prepared a highly detailed, interactive proposal for your review.</p>
              <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">Click the secure link below to view your full project breakdown, material details, and to digitally sign your agreement when you are ready to proceed.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${generatedLink}" style="background-color: ${themeColor}; color: #000000; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">View Interactive Quote &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated message from <strong>${brandName}</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
                              })
                            });
                            setClientEmailed(true);
                          } catch(e: any) {}
                          setIsSendingToClient(false);
                        }}
                        disabled={isSendingToClient}
                        className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: `${themeColor}20`, color: themeColor, border: `1px solid ${themeColor}40` }}
                      >
                        {isSendingToClient ? "Dispatching..." : `Send to Client`}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Preview Mockup */}
        <div className="relative mx-auto w-full max-w-sm sticky top-8">
          <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-white/5 rounded-[3.2rem] blur-sm"></div>
          <div className="relative bg-[#050505] border-[6px] border-[#222] rounded-[3rem] h-[800px] overflow-hidden shadow-2xl flex flex-col font-inter">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-2xl z-50"></div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar relative">
                
                {documentMode === 'pitch' ? (
                  <div className="min-h-full bg-black text-white flex flex-col relative pb-10">
                     {/* Full bleed background */}
                     {visualizationImage && (
                       <div className="absolute inset-0 z-0">
                         <img src={visualizationImage} alt="Proposed Design" className="w-full h-1/2 object-cover opacity-50" />
                         <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
                       </div>
                     )}
                     
                     <div className="relative z-10 px-5 pt-12 flex-1 flex flex-col">
                       <header className="text-center mb-8">
                         {logoUrl && <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full mx-auto mb-3 object-cover shadow-xl border border-white/20" />}
                         <h1 className="text-xl font-space font-bold tracking-tight mb-1 drop-shadow-md">{brandName}</h1>
                         <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold">Exclusive Vision Pitch</p>
                       </header>
                       
                       <div className="mt-auto backdrop-blur-xl bg-black/50 border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden mb-6">
                         <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-2xl rounded-full pointer-events-none" style={{backgroundColor: themeColor}}></div>
                         <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mb-1">Prepared Exclusively For</p>
                         <h2 className="text-lg font-bold mb-5">{activeClientName.replace(/\s*\(Lead\)\s*/gi, '')} {activeClientLast.replace(/\s*\(Lead\)\s*/gi, '')}</h2>
                         
                         <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 shadow-inner">
                           <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mb-1">Proposed Aesthetic</p>
                           <h3 className="text-sm font-space font-bold" style={{color: themeColor}}>{serviceType}</h3>
                         </div>
                         
                         <div className="text-center">
                           <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-xs shadow-xl relative overflow-hidden group" style={{backgroundColor: themeColor}}>
                             <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                             <Calendar className="text-black group-hover:animate-pulse relative z-10" size={14} /> 
                             <span className="relative z-10">Request Consultation</span>
                           </button>
                         </div>
                       </div>
                     </div>
                  </div>
                ) : (
                  <div className="pt-12 pb-8 px-6 space-y-6">
                    <header className="border-b border-white/10 pb-4 flex items-center gap-4">
                      {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-lg border border-white/10 flex-shrink-0" />
                      )}
                      <div>
                        {!logoUrl && <h1 className="text-xl font-space font-bold text-white mb-1">{brandName}</h1>}
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Total Investment</p>
                        <p className="text-3xl font-space font-bold" style={{color: themeColor}}>${estimatedTotal.toLocaleString()}</p>
                      </div>
                    </header>

                    <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-xs">
                      <p className="text-white/40 uppercase tracking-widest font-bold mb-1">Prepared For</p>
                      <p className="font-bold text-white text-sm">{activeClientName} {activeClientLast}</p>
                      <p className="text-white/60">{serviceType}</p>
                    </div>

                    {/* AI Visualization Preview */}
                    {visualizationImage && (
                      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">AI Visualization</p>
                          <button 
                            onClick={() => setVisualizationImage(null)} 
                            className="text-white/30 text-[10px] hover:text-white/60"
                          >
                            Remove
                          </button>
                        </div>
                        <img src={visualizationImage} alt="Floor visualization" className="w-full h-40 object-cover" />
                      </div>
                    )}

                    {!contractPdfUrl ? (
                      <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-xs space-y-3">
                        <h3 className="text-white font-bold flex items-center gap-2"><ShieldCheck size={14} style={{color: themeColor}}/> Digital Terms</h3>
                        <div className="text-white/60 space-y-2 leading-relaxed">
                          {legalTerms.split('\n').map((line, idx) => (
                            <p key={idx} className={line.trim() === '' ? 'h-2' : 'flex gap-2'}>
                              {line.trim() !== '' && <span style={{color: themeColor}}>•</span>} {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-xl p-3 flex items-center gap-3">
                         <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                           <FileText size={16} className="text-white" />
                         </div>
                         <div>
                           <p className="text-xs font-bold text-white">Custom Contract Attached</p>
                           <p className="text-[9px] text-white/40 font-mono">Will be embedded live for Client</p>
                         </div>
                      </div>
                    )}

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
                       <p className="text-white font-bold text-sm mb-3">Signature</p>
                       <div className="h-24 bg-white rounded-lg mb-4 opacity-50"></div>
                       <button className="w-full text-black font-bold py-3 rounded-lg text-sm" style={{backgroundColor: themeColor}}>I Agree to Terms</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
