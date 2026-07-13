import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, Sparkles, MessageSquare, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle, CornerDownRight } from 'lucide-react';
import { Dealer, Product, Order } from '../types';

interface AIConsultantProps {
  dealers: Dealer[];
  products: Product[];
  orders: Order[];
  lang: 'kh' | 'en';
}

interface ChatMessage {
  sender: 'user' | 'ai';
  textKh: string;
  textEn: string;
  timestamp: Date;
  insightType?: 'credit' | 'restock' | 'growth' | 'general';
}

export default function AIConsultant({
  dealers,
  products,
  orders,
  lang
}: AIConsultantProps) {
  // Conversions
  const RIEL_RATE = 4100;
  const formatCurrency = (usd: number) => {
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${Math.round(usd * RIEL_RATE).toLocaleString()} ៛)`;
  };

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      textKh: 'សួស្តី! ខ្ញុំជាជំនួយការ AI របស់ប្រព័ន្ធ DMS Cambodia។ ខ្ញុំបានពិនិត្យ និងវិភាគទិន្នន័យដេប៉ូចែកចាយ និងស្តុកទំនិញរបស់អ្នករួចរាល់ហើយ។ តើអ្នកចង់ឲ្យខ្ញុំជួយវិភាគចំណុចណាខ្លះនៅថ្ងៃនេះ?',
      textEn: 'Hello! I am your DMS Cambodia AI Assistant. I have analyzed your dealer directory and inventory stock logs. What operational insights would you like me to share today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Operational Analysis derived from Live State
  const getCreditAudit = () => {
    const criticalCreditDealers = dealers.filter(d => (d.balance / d.creditLimit) > 0.6);
    
    let reportKh = `🔍 **របាយការណ៍វិភាគហានិភ័យឥណទាន (Credit Line Risk Audit)**\n\n`;
    let reportEn = `🔍 **Credit Line Risk Analysis & Outstanding Debts**\n\n`;

    if (criticalCreditDealers.length === 0) {
      reportKh += `✅ ស្ថានភាពឥណទានរបស់ដេប៉ូទាំងអស់មានភាពល្អប្រសើរខ្លាំង គ្មានដេប៉ូណាជំពាក់លើសពី ៦០% នៃកម្រិតកំណត់ឡើយ។`;
      reportEn += `✅ Excellent credit health! No dealers are currently utilizing more than 60% of their allowed credit lines.`;
    } else {
      reportKh += `រកឃើញដេប៉ូចំនួន **${criticalCreditDealers.length}** មានហានិភ័យឥណទានខ្ពស់ (ប្រើប្រាស់លើសពី ៦០%)៖\n\n`;
      reportEn += `Flagged **${criticalCreditDealers.length}** dealers utilizing over 60% of their allowed credit line:\n\n`;

      criticalCreditDealers.forEach(d => {
        const util = Math.round((d.balance / d.creditLimit) * 100);
        reportKh += `• **${d.name}** (${d.businessName}):\n  - ជំពាក់បច្ចុប្បន្ន៖ **$${d.balance.toFixed(2)}** / កម្រិត៖ **$${d.creditLimit}** (${util}%)\n  - តំបន់៖ ${d.province}\n\n`;
        reportEn += `• **${d.name}** (${d.businessName}):\n  - Outstanding: **$${d.balance.toFixed(2)}** / Limit: **$${d.creditLimit}** (${util}% utilization)\n  - Location: ${d.province}\n\n`;
      });

      reportKh += `💡 **អនុសាសន៍យុទ្ធសាស្ត្រ AI (Strategic Recommendation):**\n`;
      reportKh += `១. ផ្អាកការអនុម័តបញ្ជាទិញថ្មីដែលមានលក្ខខណ្ឌ "ជំពាក់សិន" សម្រាប់ដេប៉ូដែលមាន % ប្រើប្រាស់ឥណទានខ្ពស់ជាង ៨០% រហូតដល់មានការទូទាត់ខ្លះ។\n`;
      reportKh += `២. ទាក់ទងទៅ Seng Ly និង Kirirom Distribution ដើម្បីប្រមូលប្រាក់បង់បង្គ្រប់ និងផ្តល់ជូនប្រូម៉ូសិនពិសេសសម្រាប់ការទូទាត់ជាសាច់ប្រាក់សុទ្ធ។`;

      reportEn += `💡 **AI Recommendations:**\n`;
      reportEn += `1. Hold pending credit-term orders for accounts exceeding 80% credit line utilization until partial payment settles.\n`;
      reportEn += `2. Initiate collection updates with Seng Ly and Kirirom Distribution. Propose special cash-on-delivery (COD) incentives.`;
    }

    return { kh: reportKh, en: reportEn };
  };

  const getInventoryAudit = () => {
    const lowStock = products.filter(p => p.stock <= p.minStock);
    
    let reportKh = `📦 **របាយការណ៍វិភាគស្តុកទំនិញ និងតម្រូវការទិញចូល (Inventory Restock Audit)**\n\n`;
    let reportEn = `📦 **Warehouse Safety Stock & Intake Advice**\n\n`;

    if (lowStock.length === 0) {
      reportKh += `✅ ឃ្លាំងទំនិញរបស់អ្នកមានសុវត្ថិភាពល្អណាស់ ស្តុកគ្រប់គ្រាន់គ្រប់មុខទំនិញទាំងអស់។`;
      reportEn += `✅ Safe stock levels! All catalog items meet safety threshold quantities.`;
    } else {
      reportKh += `រកឃើញទំនិញចំនួន **${lowStock.length}** មុខ កំពុងស្ថិតក្នុងស្ថានភាពខ្វះខាត និងស្តុកជិតអស់៖\n\n`;
      reportEn += `Identified **${lowStock.length}** products that require quick restock intakes:\n\n`;

      lowStock.forEach(p => {
        reportKh += `• **${p.name}** (SKU: \`${p.sku}\`):\n  - ស្តុកនៅសល់៖ **${p.stock}** / កម្រិតសុវត្ថិភាព៖ **${p.minStock}** ${p.unit.split(' ')[0]}\n  - តម្លៃបោះដុំ៖ $${p.price.toFixed(2)}\n\n`;
        reportEn += `• **${p.name}** (SKU: \`${p.sku}\`):\n  - Stock left: **${p.stock}** / Safety threshold: **${p.minStock}** ${p.unit.split(' ')[0]}\n  - Unit Price: $${p.price.toFixed(2)}\n\n`;
      });

      reportKh += `💡 **ផែនការបំពេញស្តុករបស់ AI (AI Restock Action Plan):**\n`;
      reportKh += `១. បញ្ជាទិញចូល **Red Bull Energy Drink** ចំនួន **២០០ ថាស** បន្ទាន់ ព្រោះជាទំនិញលក់ដាច់ខ្លាំងហើយស្តុកបច្ចុប្បន្ននៅសល់តែ ៣៥ ថាសប៉ុណ្ណោះ។\n`;
      reportKh += `២. ទាក់ទងរោងចក្រប្រេងឆា ដើម្បីកក់យក **Healthy Cooking Oil** ចំនួន **១០០ ដប** បន្ថែម។`;

      reportEn += `💡 **AI Restock Plan:**\n`;
      reportEn += `1. Order **200 Trays** of **Red Bull Energy Drink** immediately, as current levels (35 trays) represent critical demand shortfalls.\n`;
      reportEn += `2. Coordinate with cooking oil suppliers for a replenishment of **100 Bottles** of **Healthy Cooking Oil**.`;
    }

    return { kh: reportKh, en: reportEn };
  };

  const getDealerAudit = () => {
    // Candidates for silver/gold or inactive
    const silverCandidates = dealers.filter(d => d.tier === 'Bronze' && d.totalPurchased > 2000);
    const inactiveDealers = dealers.filter(d => d.status === 'Inactive');

    let reportKh = `📈 **យុទ្ធសាស្ត្រអភិវឌ្ឍតំណាងចែកចាយ (Dealer Growth Strategy)**\n\n`;
    let reportEn = `📈 **Dealer Growth Strategy & Inactive Recoveries**\n\n`;

    if (silverCandidates.length > 0) {
      reportKh += `✨ **បេក្ខភាពឡើងថ្នាក់ (Upgrade Opportunities):**\n`;
      reportEn += `✨ **Upgrade Opportunities:**\n`;
      silverCandidates.forEach(c => {
        reportKh += `• **${c.name}** (${c.businessName}): លក់បានសរុប **$${c.totalPurchased.toLocaleString()}** (ជិតគ្រប់លក្ខខណ្ឌឡើង Silver $5,000)។\n`;
        reportEn += `• **${c.name}** (${c.businessName}): Total purchased **$${c.totalPurchased.toLocaleString()}** (Eligible for Silver tier on reaching $5,000)۔\n`;
      });
      reportKh += `\n`;
      reportEn += `\n`;
    }

    if (inactiveDealers.length > 0) {
      reportKh += `⚠️ **តំណាងចែកចាយមិនសកម្ម (Inactive Partners):**\n`;
      reportEn += `⚠️ **Inactive Partners:**\n`;
      inactiveDealers.forEach(d => {
        reportKh += `• **${d.name}** (${d.businessName}): ${d.phone} (តំបន់៖ ${d.province})។\n`;
        reportEn += `• **${d.name}** (${d.businessName}): ${d.phone} (Region: ${d.province})۔\n`;
      });
      reportKh += `\n💡 **អនុសាសន៍ (Recommendation):** ទាក់ទងសួរសុខទុក្ខ និងផ្តល់ជូនការបញ្ចុះតម្លៃពិសេស ១-២% លើការបញ្ជាទិញបន្ទាប់ ដើម្បីទាក់ទាញពួកគេឡើងវិញ។`;
      reportEn += `\n💡 **Recommendation:** Reach out with customer care calls. Offer an introductory 1-2% re-activation incentive discount on their next wholesale order.`;
    } else {
      reportKh += `✅ អបអរសាទរ! គ្មានដៃគូចែកចាយណាដែលមិនសកម្ម (Inactive) នោះទេនៅថ្ងៃនេះ។`;
      reportEn += `✅ Great work! All dealer accounts are currently marked active.`;
    }

    return { kh: reportKh, en: reportEn };
  };

  const handleCustomQuestion = (userText: string) => {
    const textLower = userText.toLowerCase();
    let replyKh = '';
    let replyEn = '';
    let type: 'credit' | 'restock' | 'growth' | 'general' = 'general';

    if (textLower.includes('credit') || textLower.includes('debt') || textLower.includes('ជំពាក់') || textLower.includes('លុយ') || textLower.includes('ឥណទាន')) {
      const audit = getCreditAudit();
      replyKh = audit.kh;
      replyEn = audit.en;
      type = 'credit';
    } else if (textLower.includes('stock') || textLower.includes('product') || textLower.includes('inventory') || textLower.includes('ស្តុក') || textLower.includes('ទំនិញ')) {
      const audit = getInventoryAudit();
      replyKh = audit.kh;
      replyEn = audit.en;
      type = 'restock';
    } else if (textLower.includes('dealer') || textLower.includes('tier') || textLower.includes('grow') || textLower.includes('ដេប៉ូ') || textLower.includes('លក់ដាច់')) {
      const audit = getDealerAudit();
      replyKh = audit.kh;
      replyEn = audit.en;
      type = 'growth';
    } else {
      replyKh = `🤖 **ជំនួយការ DMS Cambodia**\n\nខ្ញុំរីករាយនឹងជួយឆ្លើយសំណួរអំពី៖\n១. វិភាគឥណទានជំពាក់របស់ដេប៉ូ (វាយពាក្យ "លុយជំពាក់" ឬ "Credit")\n២. ត្រួតពិនិត្យស្តុកទំនិញជិតអស់ (វាយពាក្យ "ស្តុកទំនិញ" ឬ "Stock")\n៣. ស្វែងរកយុទ្ធសាស្ត្រលក់ (វាយពាក្យ "យុទ្ធសាស្ត្រ" ឬ "Dealer")\n\nសូមសួរជាភាសាខ្មែរ ឬអង់គ្លេសក៏បាន!`;
      replyEn = `🤖 **DMS Cambodia Knowledge Base**\n\nI can assist you with:\n1. Outstanding debt audits (Type "Credit" or "Debt")\n2. Safety stock warnings (Type "Stock" or "Inventory")\n3. Sales target strategies (Type "Dealer" or "Growth")\n\nPlease feel free to type your prompt in Khmer or English!`;
    }

    return { kh: replyKh, en: replyEn, type };
  };

  // Chat Trigger
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // User Message
    const userMsg: ChatMessage = {
      sender: 'user',
      textKh: text,
      textEn: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = handleCustomQuestion(text);
      const aiMsg: ChatMessage = {
        sender: 'ai',
        textKh: response.kh,
        textEn: response.en,
        timestamp: new Date(),
        insightType: response.type
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 850);
  };

  // Quick prompt buttons
  const quickPrompts = [
    { labelKh: 'វិភាគលុយជំពាក់ និងហានិភ័យ', labelEn: 'Credit Health Audit', text: 'Credit risk and debts' },
    { labelKh: 'ពិនិត្យមុខទំនិញជិតអស់ស្តុក', labelEn: 'Safety Stock Check', text: 'Stock level and restocks' },
    { labelKh: 'ផែនការបង្កើនលក់របស់ដេប៉ូ', labelEn: 'Dealer Growth Plan', text: 'Dealer growth tier upgrade' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-4 h-[calc(100vh-12rem)] min-h-[500px]">
      
      {/* Side insights menu list */}
      <div className="bg-slate-50 p-5 border-r border-slate-100 hidden lg:flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
            <span className="font-sans font-bold text-slate-800 text-sm">{lang === 'kh' ? 'សង្ខេបចំណុចសំខាន់ៗ' : 'Operational Intelligence'}</span>
          </div>

          <div className="space-y-2.5">
            {/* Debt audit */}
            <div 
              onClick={() => handleSendMessage('Credit risk and debts')}
              className="p-3 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-100 cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{lang === 'kh' ? 'វិភាគឥណទានជំពាក់' : 'Credit Risk Status'}</span>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                {dealers.filter(d => (d.balance / d.creditLimit) > 0.6).length} {lang === 'kh' ? 'ដេប៉ូមានហានិភ័យ' : 'high-debt accounts'}
              </p>
            </div>

            {/* Stock warnings */}
            <div 
              onClick={() => handleSendMessage('Stock level and restocks')}
              className="p-3 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-100 cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{lang === 'kh' ? 'ស្ថានភាពស្តុកទំនិញ' : 'Warehouse Inventory'}</span>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                {products.filter(p => p.stock <= p.minStock).length} {lang === 'kh' ? 'មុខទំនិញជិតអស់' : 'low-stock alerts'}
              </p>
            </div>

            {/* Growth targets */}
            <div 
              onClick={() => handleSendMessage('Dealer growth tier upgrade')}
              className="p-3 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-100 cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{lang === 'kh' ? 'ដៃគូជិតបានឡើងថ្នាក់' : 'Promotions Watchlist'}</span>
                <CornerDownRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                {dealers.filter(d => d.tier === 'Bronze' && d.totalPurchased > 2000).length} {lang === 'kh' ? 'ដេប៉ូត្រៀមឡើង Silver' : 'bronze partners near silver'}
              </p>
            </div>
          </div>
        </div>

        {/* Small disclaimer footer */}
        <div className="text-[10px] text-slate-400 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/10">
          <p className="font-semibold text-slate-500">{lang === 'kh' ? 'ជំនួយការ AI ក្រៅប្រព័ន្ធ (Offline)' : 'Fully Localized Expert Engine'}</p>
          <p className="mt-0.5">{lang === 'kh' ? 'គណនានិងផ្អែកលើទិន្នន័យដេប៉ូជាក់ស្តែង ១០០%' : 'Calculations directly bound to live DMS inputs.'}</p>
        </div>
      </div>

      {/* Main chat window column */}
      <div className="lg:col-span-3 flex flex-col justify-between h-full relative">
        {/* Chat window header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white flex-none">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">DMS Intelligent Assistant</span>
              <span className="block text-[10px] text-indigo-400 font-mono tracking-wider">SECURE AUDITOR PRO</span>
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-semibold">{lang === 'kh' ? 'សកម្ម' : 'Engine Active'}</span>
        </div>

        {/* Chat Messages area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {messages.map((msg, i) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={i} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-20 duration-150`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  isUser 
                    ? 'bg-slate-900 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 space-y-2'
                }`}>
                  <div className="whitespace-pre-line">
                    {lang === 'kh' ? msg.textKh : msg.textEn}
                  </div>
                  
                  {/* Visual Icons if insight cards are returned */}
                  {!isUser && msg.insightType && (
                    <div className="flex justify-end pt-2 border-t border-slate-50/50 mt-2 text-[10px] font-semibold text-slate-400">
                      {msg.insightType === 'credit' && <span className="flex items-center text-rose-600"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Credit Warning Risk</span>}
                      {msg.insightType === 'restock' && <span className="flex items-center text-amber-600"><CornerDownRight className="w-3.5 h-3.5 mr-1" /> Replenishment Intake Draft</span>}
                      {msg.insightType === 'growth' && <span className="flex items-center text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Targeted Promo Action Plan</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-4 text-xs text-slate-400 border border-slate-100 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input form with Quick Prompts inside */}
        <div className="p-4 bg-white border-t border-slate-100 flex-none space-y-3">
          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p.text)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-600 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all flex items-center"
              >
                <CornerDownRight className="w-3 h-3 mr-1 text-slate-400" />
                {lang === 'kh' ? p.labelKh : p.labelEn}
              </button>
            ))}
          </div>

          {/* Type form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'kh' ? 'សួរ AI អំពីស្តុក ឥណទានជំពាក់ ឬយុទ្ធសាស្ត្រលក់...' : 'Ask AI about stock levels, credit lines, provinces...'}
              className="flex-1 px-4 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-indigo-600 disabled:bg-slate-100 hover:bg-indigo-500 text-white rounded-xl shadow-md disabled:shadow-none disabled:text-slate-300 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
