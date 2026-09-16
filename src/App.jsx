import React, { useState, useEffect, useRef } from 'react';

const FIXED_RATE = 1.35;

export default function FarmLife() {
  // Αποθηκευμένα διαπιστευτήρια
  const [savedCredentials, setSavedCredentials] = useState(() => {
    const saved = localStorage.getItem('farmlife_credentials');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { username: 'Κώστας Γρηγοριάδης', password: '123' };
  });

  const [currentUser, setCurrentUser] = useState(null);
  
  // Φόρμες εισόδου / ορισμού
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYearStr);

  // Διαχείριση πλοήγησης / UI: 'dashboard' | 'analytics' | 'power' | 'backup'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Σταθερά στοιχεία χωραφιών
  const fields = [
    { id: 1, name: 'Χωράφι #1', area: 4, crops: ['Ελιές', 'Πορτοκάλια Ναβαλίνες'] },
    { id: 2, name: 'Χωράφι #2', area: 5, crops: ['Ελιές', 'Πορτοκάλια Βαλέντσια'] },
  ];

  // Δεδομένα ανά έτος
  const [yearlyData, setYearlyData] = useState(() => {
    const saved = localStorage.getItem('farmlife_yearly_data_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      [currentYearStr]: {
        1: { expenses: 0, productionKg: 0, revenue: 0 },
        2: { expenses: 0, productionKg: 0, revenue: 0 }
      }
    };
  });

  // Ιστορικό κινήσεων
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('farmlife_history_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // Δεδομένα Υπολογιστή Ρεύματος Ποτίσματος
  const [totalBill, setTotalBill] = useState(() => {
    return localStorage.getItem('farmlife_power_bill') || '';
  });

  const [farmers, setFarmers] = useState(() => {
    const saved = localStorage.getItem('farmlife_power_farmers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 1, name: 'Πατέρας & Τάκης', hours: 0 },
      { id: 2, name: 'Κώστας', hours: 0 },
      { id: 3, name: 'Σούλα', hours: 0 },
      { id: 4, name: 'Βαγγέλης', hours: 0 },
      { id: 5, name: 'Γλεντζές', hours: 0 },
      { id: 6, name: 'Χρόνης', hours: 0 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('farmlife_yearly_data_v2', JSON.stringify(yearlyData));
  }, [yearlyData]);

  useEffect(() => {
    localStorage.setItem('farmlife_history_v2', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('farmlife_power_bill', totalBill.toString());
  }, [totalBill]);

  useEffect(() => {
    localStorage.setItem('farmlife_power_farmers', JSON.stringify(farmers));
  }, [farmers]);

  // Modal Νέου Έτους
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  // States φορμών Dashboard
  const [selectedField, setSelectedField] = useState(1);
  const [expenseType, setExpenseType] = useState('Καύσιμα');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(fields[0].crops[0]);
  const [prodKg, setProdKg] = useState('');
  const [prodRevenue, setProdRevenue] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const field = fields.find(f => f.id === Number(selectedField));
    if (field && field.crops.length > 0) {
      setSelectedCrop(field.crops[0]);
    }
  }, [selectedField]);

  // Χειρισμός Ρεύματος
  const handleHoursChange = (id, value) => {
    const numValue = parseFloat(value) || 0;
    setFarmers(prev =>
      prev.map(f => (f.id === id ? { ...f, hours: numValue } : f))
    );
  };

  const handleResetPower = () => {
    if (window.confirm("Θέλετε να μηδενιστούν όλες οι ώρες και ο λογαριασμός ρεύματος;")) {
      setTotalBill('');
      setFarmers(prev => prev.map(f => ({ ...f, hours: 0 })));
    }
  };

  const totalPowerHours = farmers.reduce((sum, f) => sum + (Number(f.hours) || 0), 0);
  const calculatedPowerTotal = totalPowerHours * FIXED_RATE;

  // Διαδικασία Σύνδεσης
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (isRegisterMode) {
      if (!usernameInput.trim() || !passwordInput.trim()) {
        setLoginError('Παρακαλώ συμπληρώστε όνομα χρήστη και κωδικό.');
        return;
      }
      const newCreds = { username: usernameInput.trim(), password: passwordInput.trim() };
      setSavedCredentials(newCreds);
      localStorage.setItem('farmlife_credentials', JSON.stringify(newCreds));
      setCurrentUser(newCreds.username);
      return;
    }

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Παρακαλώ συμπληρώστε τα στοιχεία σας.');
      return;
    }

    if (
      usernameInput.trim() === savedCredentials.username &&
      passwordInput.trim() === savedCredentials.password
    ) {
      setCurrentUser(savedCredentials.username);
    } else {
      setLoginError('Λάθος όνομα χρήστη ή κωδικός πρόσβασης.');
    }
  };

  const handleQuickLogin = () => {
    setCurrentUser(savedCredentials.username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setLoginError('');
  };

  const currentYearData = yearlyData[selectedYear] || {
    1: { expenses: 0, productionKg: 0, revenue: 0 },
    2: { expenses: 0, productionKg: 0, revenue: 0 }
  };

  const displayedHistory = history.filter(item => item.year === selectedYear);

  const totalExpenses = Object.values(currentYearData).reduce((acc, f) => acc + Number(f.expenses || 0), 0);
  const totalRevenue = Object.values(currentYearData).reduce((acc, f) => acc + Number(f.revenue || 0), 0);
  const totalProductionKg = Object.values(currentYearData).reduce((acc, f) => acc + Number(f.productionKg || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Προσθήκη Έτους
  const handleCreateYear = (e) => {
    e.preventDefault();
    const trimmedYear = newYearInput.trim();
    if (!trimmedYear || isNaN(trimmedYear) || trimmedYear.length !== 4) {
      alert('Παρακαλώ δώσε ένα έγκυρο 4ψήφιο έτος (π.χ. 2027).');
      return;
    }

    if (yearlyData[trimmedYear]) {
      setSelectedYear(trimmedYear);
      setShowYearModal(false);
      setNewYearInput('');
      return;
    }

    setYearlyData(prev => ({
      ...prev,
      [trimmedYear]: {
        1: { expenses: 0, productionKg: 0, revenue: 0 },
        2: { expenses: 0, productionKg: 0, revenue: 0 }
      }
    }));

    setSelectedYear(trimmedYear);
    setShowYearModal(false);
    setNewYearInput('');
  };

  // Διαχείριση Εξόδου
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(expenseAmount)) return;
    const amountNum = Number(expenseAmount);
    const fieldIdNum = Number(selectedField);

    if (editingId) {
      const oldItem = history.find(item => item.id === editingId);
      if (oldItem) {
        const diff = amountNum - oldItem.rawAmount;
        const targetYear = oldItem.year || selectedYear;

        setYearlyData(prev => {
          const yearFields = prev[targetYear] || { 1: {expenses:0, productionKg:0, revenue:0}, 2: {expenses:0, productionKg:0, revenue:0} };
          const curField = yearFields[oldItem.fieldId] || { expenses: 0, productionKg: 0, revenue: 0 };
          return { ...prev, [targetYear]: { ...yearFields, [oldItem.fieldId]: { ...curField, expenses: Math.max(0, curField.expenses + diff) } } };
        });

        setHistory(history.map(item => item.id === editingId ? {
          ...item,
          fieldId: fieldIdNum,
          fieldName: fields.find(f => f.id === fieldIdNum)?.name || 'Χωράφι',
          details: `${expenseType}: €${amountNum}`,
          rawAmount: amountNum,
        } : item));
      }
      setEditingId(null);
    } else {
      const targetField = fields.find(f => f.id === fieldIdNum);
      setYearlyData(prev => {
        const yearFields = prev[selectedYear] || { 1: {expenses:0, productionKg:0, revenue:0}, 2: {expenses:0, productionKg:0, revenue:0} };
        const curField = yearFields[fieldIdNum] || { expenses: 0, productionKg: 0, revenue: 0 };
        return { ...prev, [selectedYear]: { ...yearFields, [fieldIdNum]: { ...curField, expenses: curField.expenses + amountNum } } };
      });

      const newRecord = {
        id: Date.now(),
        year: selectedYear,
        fieldId: fieldIdNum,
        type: 'Έξοδο',
        fieldName: targetField ? targetField.name : 'Χωράφι',
        details: `${expenseType}: €${amountNum}`,
        rawAmount: amountNum,
        date: new Date().toLocaleDateString('el-GR')
      };
      setHistory([newRecord, ...history]);
    }
    setExpenseAmount('');
  };

  // Διαχείριση Συγκομιδής
  const handleAddProduction = (e) => {
    e.preventDefault();
    const kgNum = Number(prodKg || 0);
    const revNum = Number(prodRevenue || 0);
    if (kgNum === 0 && revNum === 0) return;
    const fieldIdNum = Number(selectedField);

    if (editingId) {
      const oldItem = history.find(item => item.id === editingId);
      if (oldItem) {
        const kgDiff = kgNum - oldItem.rawKg;
        const revDiff = revNum - oldItem.rawRev;
        const targetYear = oldItem.year || selectedYear;

        setYearlyData(prev => {
          const yearFields = prev[targetYear] || { 1: {expenses:0, productionKg:0, revenue:0}, 2: {expenses:0, productionKg:0, revenue:0} };
          const curField = yearFields[oldItem.fieldId] || { expenses: 0, productionKg: 0, revenue: 0 };
          return {
            ...prev,
            [targetYear]: {
              ...yearFields,
              [oldItem.fieldId]: {
                ...curField,
                productionKg: Math.max(0, curField.productionKg + kgDiff),
                revenue: Math.max(0, curField.revenue + revDiff)
              }
            }
          };
        });

        setHistory(history.map(item => item.id === editingId ? {
          ...item,
          fieldId: fieldIdNum,
          fieldName: fields.find(f => f.id === fieldIdNum)?.name || 'Χωράφι',
          details: `${selectedCrop}: ${kgNum} kg / Έσοδα: €${revNum}`,
          rawKg: kgNum,
          rawRev: revNum,
          crop: selectedCrop
        } : item));
      }
      setEditingId(null);
    } else {
      const targetField = fields.find(f => f.id === fieldIdNum);
      setYearlyData(prev => {
        const yearFields = prev[selectedYear] || { 1: {expenses:0, productionKg:0, revenue:0}, 2: {expenses:0, productionKg:0, revenue:0} };
        const curField = yearFields[fieldIdNum] || { expenses: 0, productionKg: 0, revenue: 0 };
        return {
          ...prev,
          [selectedYear]: {
            ...yearFields,
            [fieldIdNum]: {
              ...curField,
              productionKg: curField.productionKg + kgNum,
              revenue: curField.revenue + revNum
            }
          }
        };
      });

      const newRecord = {
        id: Date.now(),
        year: selectedYear,
        fieldId: fieldIdNum,
        type: 'Συγκομιδή / Πώληση',
        fieldName: targetField ? targetField.name : 'Χωράφι',
        details: `${selectedCrop}: ${kgNum} kg / Έσοδα: €${revNum}`,
        rawKg: kgNum,
        rawRev: revNum,
        crop: selectedCrop,
        date: new Date().toLocaleDateString('el-GR')
      };
      setHistory([newRecord, ...history]);
    }
    setProdKg('');
    setProdRevenue('');
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    if (item.year) setSelectedYear(item.year);
    setSelectedField(item.fieldId || 1);
    
    if (item.type === 'Έξοδο') {
      setExpenseAmount(item.rawAmount || '');
    } else {
      setProdKg(item.rawKg || '');
      setProdRevenue(item.rawRev || '');
      if (item.crop) setSelectedCrop(item.crop);
    }
    setActiveTab('dashboard');
  };

  const handleDeleteItem = (id) => {
    const itemToDelete = history.find(item => item.id === id);
    if (!itemToDelete) return;

    const targetYear = itemToDelete.year || selectedYear;

    setYearlyData(prev => {
      const yearFields = prev[targetYear];
      if (!yearFields || !yearFields[itemToDelete.fieldId]) return prev;
      const curField = yearFields[itemToDelete.fieldId];

      let updatedField = { ...curField };
      if (itemToDelete.type === 'Έξοδο') {
        updatedField.expenses = Math.max(0, curField.expenses - (itemToDelete.rawAmount || 0));
      } else {
        updatedField.productionKg = Math.max(0, curField.productionKg - (itemToDelete.rawKg || 0));
        updatedField.revenue = Math.max(0, curField.revenue - (itemToDelete.rawRev || 0));
      }

      return { ...prev, [targetYear]: { ...yearFields, [itemToDelete.fieldId]: updatedField } };
    });

    setHistory(history.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // --- BACKUP & CSV ---
  const exportToCSV = () => {
    if (displayedHistory.length === 0) {
      alert(`Δεν υπάρχουν καταχωρήσεις για το έτος ${selectedYear} προς εξαγωγή.`);
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Ημερομηνία,Έτος,Χωράφι,Τύπος Κίνησης,Λεπτομέρειες,Ποσό/Κιλά\n";

    displayedHistory.forEach(item => {
      const amountVal = item.type === 'Έξοδο' ? `€${item.rawAmount}` : `${item.rawKg} kg / €${item.rawRev}`;
      csvContent += `"${item.date}","${item.year}","${item.fieldName}","${item.type}","${item.details}","${amountVal}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FarmLife_${selectedYear}_KostaGrigoriadi.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFullBackup = () => {
    const backupData = {
      app: "FarmLife",
      version: "2.1",
      user: currentUser,
      credentials: savedCredentials,
      backupDate: new Date().toISOString(),
      yearlyData,
      history,
      power: {
        totalBill,
        farmers
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FarmLife_Full_Backup_${new Date().toLocaleDateString('el-GR').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFullBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.yearlyData && parsed.history) {
          if (window.confirm("Προσοχή: Η επαναφορά θα αντικαταστήσει τα τρέχοντα δεδομένα. Θέλετε να συνεχίσετε;")) {
            setYearlyData(parsed.yearlyData);
            setHistory(parsed.history);
            if (parsed.credentials) {
              setSavedCredentials(parsed.credentials);
              localStorage.setItem('farmlife_credentials', JSON.stringify(parsed.credentials));
            }
            if (parsed.power) {
              if (parsed.power.totalBill !== undefined) setTotalBill(parsed.power.totalBill);
              if (parsed.power.farmers) setFarmers(parsed.power.farmers);
            }
            alert("Η επαναφορά των δεδομένων ολοκληρώθηκε με επιτυχία!");
          }
        } else {
          alert("Μη έγκυρο αρχείο αντιγράφου ασφαλείας.");
        }
      } catch (err) {
        alert("Σφάλμα κατά την ανάγνωση του αρχείου αντιγράφου ασφαλείας.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Στατιστικά
  const allYearsSorted = Object.keys(yearlyData).sort().reverse();
  const yearlySummaries = allYearsSorted.map(year => {
    const data = yearlyData[year] || {};
    const exp = Object.values(data).reduce((acc, f) => acc + Number(f.expenses || 0), 0);
    const rev = Object.values(data).reduce((acc, f) => acc + Number(f.revenue || 0), 0);
    const kg = Object.values(data).reduce((acc, f) => acc + Number(f.productionKg || 0), 0);
    const profit = rev - exp;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
    return { year, exp, rev, kg, profit, margin, data };
  });

  const cropStats = {};
  history.filter(h => h.year === selectedYear && h.type === 'Συγκομιδή / Πώληση').forEach(item => {
    const cropName = item.crop || 'Λοιπά';
    if (!cropStats[cropName]) {
      cropStats[cropName] = { kg: 0, rev: 0 };
    }
    cropStats[cropName].kg += item.rawKg || 0;
    cropStats[cropName].rev += item.rawRev || 0;
  });

  // --- ΟΘΟΝΗ ΣΥΝΔΕΣΗΣ ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 max-w-md w-full shadow-2xl border border-white/20 space-y-5">
          
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-3xl shadow-inner mb-1">
              🌱
            </div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight">FarmLife</h1>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {isRegisterMode ? 'Ορισμός Νέων Στοιχείων' : 'Σύστημα Διαχείρισης Αγροτικής Παραγωγής'}
            </p>
          </div>

          {!isRegisterMode && savedCredentials && savedCredentials.username && (
            <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 text-center space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Γρηγορη Εισοδος
              </span>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm shadow-md shadow-emerald-800/20 transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Σύνδεση ως {savedCredentials.username}</span>
              </button>
            </div>
          )}

          {!isRegisterMode && (
            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ή πληκτρολογήστε κωδικό
              </span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>
          )}

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Όνομα Χρήστη
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                  👤
                </span>
                <input 
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={isRegisterMode ? "π.χ. Κώστας Γρηγοριάδης" : "Όνομα χρήστη"}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Κωδικός Πρόσβασης
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                  🔒
                </span>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none focus:bg-white transition"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm transition transform active:scale-[0.98]"
            >
              {isRegisterMode ? 'Αποθήκευση & Είσοδος' : 'Είσοδος με Στοιχεία'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button 
              onClick={() => { setIsRegisterMode(!isRegisterMode); setLoginError(''); }}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              {isRegisterMode ? '← Επιστροφή στη Σύνδεση' : '⚙️ Ορισμός νέου ονόματος / κωδικού'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- ΚΥΡΙΩΣ ΕΦΑΡΜΟΓΗ ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-stone-50 to-emerald-100/30 flex flex-col md:flex-row font-sans text-slate-800 selection:bg-emerald-200">
      
      {/* Mobile Topbar */}
      <header className="md:hidden bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-emerald-900/10 px-4 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100/80 flex items-center justify-center text-base shadow-2xs">
            🌱
          </div>
          <div>
            <h1 className="font-black text-emerald-950 text-base leading-tight">FarmLife</h1>
            <p className="text-[10px] text-emerald-700 font-semibold">Αγροτική Παραγωγή</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold transition active:scale-95"
        >
          <span>📑</span>
          <span>Μενού</span>
        </button>
      </header>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:static md:z-auto
        w-80 bg-white/95 backdrop-blur-md border-r border-emerald-900/10 p-6 flex flex-col justify-between shrink-0 shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-green-500 flex items-center justify-center text-2xl text-white shadow-md shadow-emerald-700/25">
                🌱
              </div>
              <div>
                <h2 className="font-black text-xl text-emerald-950 tracking-tight leading-tight">FarmLife</h2>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Agro Management</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* User Profile Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-4 shadow-lg shadow-emerald-950/20 border border-emerald-800/40">
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black flex items-center justify-center text-lg shadow-inner shrink-0">
                {currentUser.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">Χρήστης</span>
                <p className="text-sm font-extrabold text-white truncate leading-snug">{currentUser}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] text-emerald-200/90 font-medium">Συνδεδεμένος</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Main Navigation (4 Επιλογές) */}
          <nav className="space-y-1.5">
            <div className="px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Κύρια Πλοήγηση
            </div>

            {/* Tab 1: Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition group ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">📊</span>
                <span>Διαχείριση & Σοδειά</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'dashboard' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
              }`}>
                {displayedHistory.length}
              </span>
            </button>

            {/* Tab 2: Analytics */}
            <button
              onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition group ${
                activeTab === 'analytics'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">📈</span>
                <span>Ετήσια Σύγκριση & Στατιστικά</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'analytics' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
              }`}>
                {allYearsSorted.length} έτη
              </span>
            </button>

            {/* Tab 3: Ρεύμα Ποτίσματος */}
            <button
              onClick={() => { setActiveTab('power'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition group ${
                activeTab === 'power'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">⚡</span>
                <span>Ρεύμα Ποτίσματος</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                1.35€/h
              </span>
            </button>

            {/* Tab 4: Backup */}
            <button
              onClick={() => { setActiveTab('backup'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition group ${
                activeTab === 'backup'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">💾</span>
                <span>Αντίγραφα Ασφαλείας & Excel</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                Export
              </span>
            </button>
          </nav>

          {/* Mini Widget Χωραφιών */}
          <div className="bg-emerald-50/50 border border-emerald-900/10 rounded-3xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ενεργα Χωραφια</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">2 Αγροτεμάχια</span>
            </div>
            
            <div className="space-y-2 text-xs">
              {fields.map(f => (
                <div key={f.id} className="bg-white/90 p-2.5 rounded-2xl border border-emerald-900/5 shadow-2xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{f.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded">
                      {f.area} στρ.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {f.crops.map((c, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-emerald-900/10 space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition active:scale-98"
          >
            <span>🚪</span>
            <span>Αποσύνδεση Χρήστη</span>
          </button>
          <div className="text-center text-[10px] text-slate-400">
            FarmLife v2.1 • 2026
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full">
        
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
              🌱 Σύστημα Διαχείρισης Αγροτικής Παραγωγής
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5 font-medium">
              {activeTab === 'dashboard' && 'Εποπτεία παραγωγής, εξόδων και αποτελεσμάτων ανά καλλιεργητική περίοδο'}
              {activeTab === 'analytics' && 'Συγκριτικά οικονομικά στοιχεία και αποδόσεις ανά καλλιεργητικό έτος'}
              {activeTab === 'power' && 'Επιμερισμός λογαριασμού και υπολογισμός ωρών ποτίσματος ανά αγρότη'}
              {activeTab === 'backup' && 'Εξαγωγή αρχείων σε Excel και διαχείριση αντιγράφων ασφαλείας'}
            </p>
          </div>
          
          {activeTab !== 'power' ? (
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Έτος:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border-2 border-emerald-200 rounded-xl px-3.5 py-2 text-sm font-extrabold bg-emerald-50/60 text-slate-800 shadow-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allYearsSorted.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowYearModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3.5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-700/25 transition active:scale-95"
              >
                + Νέο Έτος
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-2 rounded-xl text-xs font-black shadow-xs">
              <span>⚡</span> Σταθερή Χρέωση: 1.35€ / ώρα
            </div>
          )}
        </header>

        {showYearModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Προσθήκη Νέου Έτους</h3>
              <p className="text-xs text-slate-500 font-medium">
                Πληκτρολόγησε το νέο έτος (π.χ. 2027). Οι δείκτες θα ξεκινήσουν καθαροί από το 0.
              </p>
              <form onSubmit={handleCreateYear} className="space-y-3">
                <input 
                  type="number"
                  placeholder="π.χ. 2027"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full border-2 border-emerald-200 rounded-xl p-3 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowYearModal(false); setNewYearInput(''); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Ακύρωση
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
                  >
                    Δημιουργία
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            ΠΡΟΒΟΛΗ 1: DASHBOARD
           ========================================================= */}
        {activeTab === 'dashboard' && (
          <>
            {editingId && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-3 rounded-2xl flex justify-between items-center font-semibold">
                <span>⚠️ Επεξεργάζεσαι καταχώριση για το έτος: <strong>{selectedYear}</strong></span>
                <button 
                  onClick={() => { setEditingId(null); setExpenseAmount(''); setProdKg(''); setProdRevenue(''); }} 
                  className="underline text-red-600 font-bold ml-2"
                >
                  Ακύρωση
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-emerald-900/10 flex flex-col justify-between text-center min-h-[145px]">
                <div className="h-9 flex items-center justify-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                    Συνολικη Παραγωγη
                  </p>
                </div>
                <div className="my-auto py-1">
                  <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                    {(totalProductionKg / 1000).toFixed(2)}{' '}
                    <span className="text-sm font-bold text-slate-400">τόνοι</span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Έτος {selectedYear}
                </span>
              </div>

              <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-emerald-900/10 flex flex-col justify-between text-center min-h-[145px]">
                <div className="h-9 flex items-center justify-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                    Συνολικα Εξοδα
                  </p>
                </div>
                <div className="my-auto py-1">
                  <p className="text-2xl font-black text-red-600 tracking-tight leading-none">
                    € {totalExpenses}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Χωράφι #1 & #2
                </span>
              </div>

              <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-emerald-900/10 flex flex-col justify-between text-center min-h-[145px]">
                <div className="h-9 flex items-center justify-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                    Συνολικα Εσοδα
                  </p>
                </div>
                <div className="my-auto py-1">
                  <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">
                    € {totalRevenue}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Από πωλήσεις
                </span>
              </div>

              <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-emerald-900/10 flex flex-col justify-between text-center min-h-[145px]">
                <div className="h-9 flex items-center justify-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                    Καθαρο Αποτελεσμα
                  </p>
                </div>
                <div className="my-auto py-1">
                  <p className={`text-2xl font-black tracking-tight leading-none ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    € {netProfit}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Έσοδα - Έξοδα
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/95 backdrop-blur-md p-6 md:p-7 rounded-3xl shadow-sm border border-emerald-900/10">
              {/* Καταχώριση Εξόδου */}
              <form onSubmit={handleAddExpense} className="space-y-4">
                <h3 className="text-base font-black text-slate-800 inline-flex items-center gap-2">
                  <span>💳</span>
                  <span>{editingId ? `Ενημέρωση Εξόδου (${selectedYear})` : `Καταχώριση Εξόδου (${selectedYear})`}</span>
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Χωράφι</label>
                  <select 
                    value={selectedField} 
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="w-full bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 font-bold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                  >
                    {fields.map(f => <option key={f.id} value={f.id} className="text-slate-800 font-medium">{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Κατηγορία Έξοδου</label>
                  <select 
                    value={expenseType} 
                    onChange={(e) => setExpenseType(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-800 font-semibold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="Καύσιμα">Καύσιμα (Τρακτέρ/Μηχανήματα)</option>
                    <option value="Λιπάσματα">Λιπάσματα / Φυτοπροστασία</option>
                    <option value="Εργασίες">Εργασίες / Ημερομίσθια</option>
                    <option value="Πότισμα">Πότισμα (Νερό/Ρεύμα)</option>
                    <option value="Λοιπά">Λοιπά Έξοδα</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ποσό (€)</label>
                  <input 
                    type="number" 
                    value={expenseAmount} 
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="π.χ. 150"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-slate-800 placeholder-slate-400 font-semibold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold transition shadow-md shadow-emerald-700/20 active:scale-98">
                  {editingId ? 'Αποθήκευση Αλλαγής Εξόδου' : 'Προσθήκη Εξόδου'}
                </button>
              </form>

              {/* Καταχώριση Συγκομιδής */}
              <form onSubmit={handleAddProduction} className="space-y-4">
                <h3 className="text-base font-black text-slate-800 inline-flex items-center gap-2">
                  <span>🍊</span>
                  <span>{editingId ? `Ενημέρωση Συγκομιδής (${selectedYear})` : `Καταχώριση Συγκομιδής (${selectedYear})`}</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Χωράφι</label>
                    <select 
                      value={selectedField} 
                      onChange={(e) => setSelectedField(e.target.value)}
                      className="w-full bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 font-bold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                    >
                      {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ποικιλία / Σοδειά</label>
                    <select 
                      value={selectedCrop} 
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 font-bold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                    >
                      {fields.find(f => f.id === Number(selectedField))?.crops.map(crop => (
                        <option key={crop} value={crop} className="text-slate-800 font-medium">{crop}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ποσότητα (Kg)</label>
                    <input 
                      type="number" 
                      value={prodKg} 
                      onChange={(e) => setProdKg(e.target.value)}
                      placeholder="π.χ. 5000"
                      className="w-full bg-slate-50 border-2 border-slate-300 text-slate-800 placeholder-slate-400 font-semibold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Έσοδα (€)</label>
                    <input 
                      type="number" 
                      value={prodRevenue} 
                      onChange={(e) => setProdRevenue(e.target.value)}
                      placeholder="π.χ. 1200"
                      className="w-full bg-slate-50 border-2 border-slate-300 text-slate-800 placeholder-slate-400 font-semibold rounded-xl p-2.5 text-sm shadow-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold transition shadow-md shadow-emerald-700/20 mt-2 active:scale-98">
                  {editingId ? 'Αποθήκευση Αλλαγής Συγκομιδής' : 'Καταχώριση Συγκομιδής'}
                </button>
              </form>
            </div>

            {/* History Section */}
            <div className="bg-white/95 backdrop-blur-md p-6 md:p-7 rounded-3xl shadow-sm border border-emerald-900/10 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>📋</span> Ιστορικό Κινήσεων ({selectedYear})
                </h3>
                <span className="text-xs font-medium text-slate-400">Συγκεντρωτικά και για τα 2 χωράφια</span>
              </div>
              
              {displayedHistory.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 bg-emerald-50/40 p-6 rounded-2xl text-center border border-emerald-900/5">
                  Δεν υπάρχουν καταχωρήσεις για το έτος {selectedYear}.
                </p>
              ) : (
                <div className="divide-y divide-emerald-900/5 max-h-64 overflow-y-auto">
                  {displayedHistory.map(item => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-emerald-50/50 px-3 rounded-xl transition">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">{item.fieldName}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-600 text-sm font-medium">{item.details}</span>
                      </div>
                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.type === 'Έξοδο' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {item.type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                        <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:underline text-xs font-bold ml-2">Επεξεργασία</button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:underline text-xs font-bold">Διαγραφή</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* =========================================================
            ΠΡΟΒΟΛΗ 2: ANALYTICS
           ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm">
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>🎯</span> Επισκόπηση Απόδοσης Ανά Στρέμμα ({selectedYear})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(f => {
                  const fData = currentYearData[f.id] || { expenses: 0, productionKg: 0, revenue: 0 };
                  const fProfit = fData.revenue - fData.expenses;
                  const profitPerStremma = (fProfit / f.area).toFixed(0);
                  const kgPerStremma = (fData.productionKg / f.area).toFixed(0);

                  return (
                    <div key={f.id} className="bg-gradient-to-br from-emerald-50/50 to-stone-50 p-5 rounded-2xl border border-emerald-900/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800 text-base">{f.name}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                          {f.area} Στρέμματα
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block font-medium">Παραγωγή/Στρέμμα</span>
                          <span className="text-sm font-black text-slate-800">{kgPerStremma} kg</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block font-medium">Κέρδος/Στρέμμα</span>
                          <span className={`text-sm font-black ${Number(profitPerStremma) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            € {profitPerStremma}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Έσοδα: <strong>€ {fData.revenue}</strong></span>
                        <span>Έξοδα: <strong>€ {fData.expenses}</strong></span>
                        <span>Καθαρό: <strong className={fProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>€ {fProfit}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm">
              <h3 className="text-base font-black text-slate-800 mb-3 flex items-center gap-2">
                <span>🏷️</span> Μέση Τιμή Πώλησης ανά Σοδειά ({selectedYear})
              </h3>
              
              {Object.keys(cropStats).length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                  Δεν έχουν καταγραφεί πωλήσεις σοδειάς για το έτος {selectedYear}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(cropStats).map(([crop, data]) => {
                    const avgPrice = data.kg > 0 ? (data.rev / data.kg).toFixed(2) : '0.00';
                    return (
                      <div key={crop} className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl text-center">
                        <p className="text-xs font-bold text-emerald-950">{crop}</p>
                        <p className="text-2xl font-black text-emerald-800 mt-1">€ {avgPrice} <span className="text-xs font-normal text-slate-500">/ kg</span></p>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Σύνολο: {data.kg.toLocaleString()} kg | € {data.rev.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>📊</span> Συγκριτικός Πίνακας Όλων των Ετών
              </h3>
              <p className="text-xs text-slate-500">
                Σύγκριση παραγωγής, εσόδων, εξόδων και κερδοφορίας διαχρονικά.
              </p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50/80 text-emerald-950 font-bold border-b border-emerald-200">
                    <tr>
                      <th className="p-3 rounded-l-xl">Έτος</th>
                      <th className="p-3">Παραγωγή (Τόνοι)</th>
                      <th className="p-3">Συνολικά Έξοδα</th>
                      <th className="p-3">Συνολικά Έσοδα</th>
                      <th className="p-3">Καθαρό Κέρδος</th>
                      <th className="p-3 rounded-r-xl">Περιθώριο (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {yearlySummaries.map(s => (
                      <tr key={s.year} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-black text-slate-800 flex items-center gap-1.5">
                          <span>📅</span> {s.year}
                          {s.year === selectedYear && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Ενεργό</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{(s.kg / 1000).toFixed(2)} τ.</td>
                        <td className="p-3 font-semibold text-red-600">€ {s.exp}</td>
                        <td className="p-3 font-semibold text-emerald-600">€ {s.rev}</td>
                        <td className={`p-3 font-black ${s.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          € {s.profit}
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          {s.margin}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            ΠΡΟΒΟΛΗ 3: ΡΕΥΜΑ ΠΟΤΙΣΜΑΤΟΣ (ΕΝΣΩΜΑΤΩΜΕΝΟ)
           ========================================================= */}
        {activeTab === 'power' && (
          <div className="space-y-6">
            
            {/* Bar Συνολικών Ρεύματος */}
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ποσό Λογαριασμού (€):
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={totalBill}
                  onChange={e => setTotalBill(e.target.value)}
                  className="w-32 bg-slate-50 border-2 border-emerald-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700">
                  Σύνολο Ωρών: <strong className="text-slate-900 text-sm ml-1">{totalPowerHours} hrs</strong>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-900">
                  Υπολογισμένο Σύνολο: <strong className="text-emerald-700 text-base ml-1">{calculatedPowerTotal.toFixed(2)} €</strong>
                </div>
              </div>
            </div>

            {/* Grid Αγροτών */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmers.map(farmer => {
                const cost = (farmer.hours || 0) * FIXED_RATE;
                return (
                  <div key={farmer.id} className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-emerald-900/10 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-base">{farmer.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md">
                        #{farmer.id}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Ώρες Ποτίσματος:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={farmer.hours || ''}
                          onChange={e => handleHoursChange(farmer.id, e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Οφειλή (1.35€/h):
                        </span>
                        <div className="bg-emerald-50/80 border border-emerald-200 px-3 py-2 rounded-xl flex justify-between items-center text-emerald-800 font-black">
                          <span className="text-base">€ {cost.toFixed(2)}</span>
                          <span className="text-xs font-semibold text-emerald-600">({farmer.hours} hrs)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Κουμπί Reset Ρεύματος */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResetPower}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-3 px-6 rounded-2xl text-xs transition active:scale-95 shadow-sm inline-flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Μηδενισμός Ωρών & Λογαριασμού Ρεύματος</span>
              </button>
            </div>

          </div>
        )}

        {/* =========================================================
            ΠΡΟΒΟΛΗ 4: BACKUP & EXCEL EXPORT
           ========================================================= */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Εξαγωγή σε Αρχείο Excel / CSV</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Κατεβάστε αναλυτικό πίνακα με όλες τις καταχωρήσεις του έτους <strong>{selectedYear}</strong> για άνοιγμα στο Excel ή αποστολή.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                <span>Έτοιμες προς εξαγωγή: <strong>{displayedHistory.length} εγγραφές</strong> ({selectedYear})</span>
                <button
                  onClick={exportToCSV}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-2"
                >
                  <span>📥</span> Λήψη Excel (CSV)
                </button>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl shrink-0">
                  💾
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Πλήρες Αντίγραφο Ασφαλείας (Backup & Restore)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Αποθηκεύστε όλα τα δεδομένα (όλα τα έτη, χωράφια, ιστορικό και καταγραφές ρεύματος) σε ένα ασφαλές αρχείο.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <span className="text-xs font-extrabold text-emerald-950 block">1. Δημιουργία Αντιγράφου</span>
                  <p className="text-[11px] text-slate-500">
                    Κατεβάζει ένα αρχείο `.json` με όλα τα αποθηκευμένα δεδομένα της εφαρμογής.
                  </p>
                  <button
                    onClick={exportFullBackup}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💾</span> Λήψη Backup
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">2. Επαναφορά Δεδομένων</span>
                  <p className="text-[11px] text-slate-500">
                    Επιλέξτε ένα παλιότερο αρχείο backup για να φορτωθούν ξανά όλα τα στοιχεία.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={importFullBackup}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>📤</span> Επιλογή Αρχείου & Επαναφορά
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Υπογραφής */}
        <footer style={{ width: '100%', marginTop: '25px', paddingBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
              Designed by <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800' }}>VasilisGrig</span>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
              COMPUTER ENGINEER
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}