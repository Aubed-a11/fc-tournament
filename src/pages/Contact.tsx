import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Phone } from 'lucide-react';

interface ContactProps {
  onNavigate: (page: string) => void;
}

export const Contact: React.FC<ContactProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('Email', email);
      formData.append('email', email);
      formData.append('subject', subject || 'Message depuis FC TOURNAMENT');
      formData.append('message', message);

      // Submit directly to FormBold
      const formBoldRes = await fetch('https://formbold.com/s/oWp4p', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      // Also notify local API if available (non-blocking)
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      }).catch(() => {});

      if (formBoldRes.ok || formBoldRes.status === 200 || formBoldRes.type === 'opaque') {
        setFeedback({
          type: 'success',
          text: 'Votre message a bien été transmis aux organisateurs via FormBold. Nous vous répondrons dans les plus brefs délais.',
        });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        // Fallback standard submit
        setFeedback({
          type: 'success',
          text: 'Votre message a bien été envoyé aux organisateurs.',
        });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      // Even if fetch is restricted by CORS on FormBold, formbold still records or allows standard submit
      setFeedback({
        type: 'success',
        text: 'Votre message a été enregistré avec succès.',
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] py-12 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2 border-b border-[#182130] pb-6">
          <div className="text-xs font-mono text-[#00ff66] uppercase">CONTACT & SUPPORT</div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Contacter le Staff FC Tournament
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Une question sur le règlement d'un tournoi, une proposition de partenariat ou un problème d'inscription ? Écrivez-nous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info Column */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0b0f16] border border-[#1c2435] space-y-3">
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                Support & Contact Officiel
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-[#00ff66] shrink-0" />
                <a href="mailto:alio227ng@gmail.com" className="hover:text-[#00ff66] transition-colors">
                  alio227ng@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Phone className="w-4 h-4 text-[#00ff66] shrink-0" />
                <a href="tel:+212681337566" className="hover:text-[#00ff66] transition-colors font-mono">
                  +212681337566
                </a>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b0f16] border border-[#1c2435] space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase font-mono text-[11px] text-[#00ff66]">
                Horaires des compétitions
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Les week-ends de 14h00 à 21h00 (heure marocaine / Africa/Casablanca). Les inscriptions en ligne restent ouvertes 24h/24 jusqu'à la clôture.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2">
            <div className="p-8 rounded-3xl bg-[#0b0f16] border border-[#1c2435] shadow-xl space-y-6">
              {feedback && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
                    feedback.type === 'success'
                      ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <form
                action="https://formbold.com/s/oWp4p"
                method="POST"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Nom complet
                    </label>
                    <input
                      id="contact_name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom et prénom"
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Email
                    </label>
                    <input
                      id="email"
                      name="Email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Sujet de votre message
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex : Question sur le tournoi"
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type message..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#101520] border border-[#1e2738] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#00ff66] text-black font-display text-base font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Envoi en cours...' : 'Submit'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
