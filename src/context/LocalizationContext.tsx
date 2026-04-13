import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocalizationContextType {
  currency: string;
  symbol: string;
  rate: number;
  loading: boolean;
  convertPrice: (price: number) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState('BDT');
  const [symbol, setSymbol] = useState('৳');
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocationAndRates = async () => {
      let userCurrency = 'BDT';
      let conversionRate = 1;

      try {
        // 1. Detect Currency via IP
        // Try multiple services for robustness
        const detectCurrency = async () => {
          // Attempt 1: ipapi.co
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.currency) return data.currency;
            }
          } catch (e) { /* ignore */ }

          // Attempt 2: freeipapi.com
          try {
            const res = await fetch('https://freeipapi.com/api/json');
            if (res.ok) {
              const data = await res.json();
              if (data.currency && data.currency.code) return data.currency.code;
            }
          } catch (e) { /* ignore */ }

          // Attempt 3: Timezone hint
          try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes('Dhaka')) return 'BDT';
            if (tz.includes('Calcutta') || tz.includes('Kolkata')) return 'INR';
          } catch (e) { /* ignore */ }

          // Fallback: Browser Locale
          try {
            const locale = navigator.language || 'en-US';
            const region = locale.split('-')[1];
            if (region === 'BD') return 'BDT';
            if (region === 'US') return 'USD';
          } catch (e) { /* ignore */ }

          return 'BDT';
        };

        userCurrency = await detectCurrency();
        
        // Force BDT if timezone is Dhaka even if IP failed
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.includes('Dhaka')) {
          userCurrency = 'BDT';
        }
        
        // 2. Get Exchange Rates (Base: BDT)
        try {
          const rateRes = await fetch(`https://open.er-api.com/v6/latest/BDT`);
          if (rateRes.ok) {
            const rateData = await rateRes.json();
            if (rateData.rates && rateData.rates[userCurrency]) {
              conversionRate = rateData.rates[userCurrency];
            }
          }
        } catch (e) {
          console.warn('Exchange rate fetch failed, using 1:1');
        }
        
        setCurrency(userCurrency);
        setRate(conversionRate);
        
        // Set Symbol
        try {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: userCurrency,
          });
          const parts = formatter.formatToParts(1);
          const symbolPart = parts.find(p => p.type === 'currency');
          setSymbol(symbolPart ? symbolPart.value : userCurrency);
        } catch (e) {
          setSymbol(userCurrency === 'BDT' ? '৳' : userCurrency);
        }

      } catch (error) {
        // Silent fail to avoid disrupting user experience
        console.warn('Localization system encountered an issue, falling back to defaults.');
      } finally {
        setLoading(false);
      }
    };

    detectLocationAndRates();
  }, []);

  const convertPrice = (price: number) => {
    const converted = price * rate;
    // Use local-friendly formatting
    const locale = currency === 'BDT' ? 'en-BD' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <LocalizationContext.Provider value={{ currency, symbol, rate, loading, convertPrice }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within LocalizationProvider');
  return context;
};
