import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
      <div className="text-2xl">💰</div>
      <div className="flex-1">
        <p className="text-white font-bold text-sm">Install VelvetLedger</p>
        <p className="text-orange-100 text-xs">Add to home screen for quick access</p>
      </div>
      <button
        onClick={install}
        className="bg-white text-orange-500 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1"
      >
        <Download size={14} /> Install
      </button>
      <button onClick={() => setShow(false)} className="text-white">
        <X size={18} />
      </button>
    </div>
  );
}
