import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  MessageCircle,
  CreditCard,
  DollarSign,
  History,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Bell,
  BellRing,
  Sliders,
  Send,
  ArrowRight,
  Wallet,
  TrendingUp,
  Share2,
  Copy,
  FilePlus,
  FileText,
  Users,
  UserPlus,
  Edit3,
  Receipt,
  MapPin,
  Phone,
  Hash
} from 'lucide-react';
import {
  CustomerDebt,
  DebtPayment,
  DebtInvoice,
  CustomerProfile,
  DebtNotificationRecord,
  CommerceStoreInfo,
  ExchangeRateData,
} from '../types';
import {
  formatUsd,
  formatVes,
  getDebtInvoices,
  getDebtBalanceInfo,
  checkDebtNotificationEligibility,
  generateDebtReminderMessage,
  generateDebtPaymentReceiptMessage,
  generateGeneralReceivablesReportMessage,
  generateNewInvoiceAddedMessage,
  generateCustomerHistoryStatementMessage,
  parseFlexibleNumber,
} from '../utils/formatters';

interface AccountsReceivableProps {
  rateData: ExchangeRateData | null;
  effectiveRate: number;
  store: CommerceStoreInfo;
  onOpenWhatsApp: (message: string) => void;
}

export const AccountsReceivable: React.FC<AccountsReceivableProps> = ({
  effectiveRate,
  store,
  onOpenWhatsApp,
}) => {
  // Stored debts - Zero data initial state
  const [debts, setDebts] = useState<CustomerDebt[]>(() => {
    try {
      const saved = localStorage.getItem('ms_morales_customer_debts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stored Customer Profiles History Directory - Zero data initial state
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem('ms_morales_customers_directory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global recurrence cadence for overdue follow-up: 2 or 3 days
  const [globalCadence, setGlobalCadence] = useState<2 | 3>(() => {
    try {
      const saved = localStorage.getItem('ms_morales_debt_cadence');
      return saved === '3' ? 3 : 2;
    } catch {
      return 2;
    }
  });

  // Main View Toggle: 'debts' (Cuentas por Cobrar) vs 'customers' (Historial de Clientes)
  const [activeView, setActiveView] = useState<'debts' | 'customers'>('debts');

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  // Modals state
  const [isNewDebtOpen, setIsNewDebtOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<CustomerDebt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<Record<string, 'invoices' | 'payments' | 'notifications'>>({});

  // Modal: Add New Invoice to Existing Customer
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState<boolean>(false);
  const [selectedDebtIdForInvoice, setSelectedDebtIdForInvoice] = useState<string>('');
  const [selectedProfileIdForInvoice, setSelectedProfileIdForInvoice] = useState<string>('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>('');
  const [invoiceDescriptionInput, setInvoiceDescriptionInput] = useState<string>('');
  const [invoiceCurrency, setInvoiceCurrency] = useState<'USD' | 'VES'>('USD');
  const [invoiceAmountInput, setInvoiceAmountInput] = useState<string>('');
  const [invoiceDueDateInput, setInvoiceDueDateInput] = useState<string>('');
  const [invoiceNotesInput, setInvoiceNotesInput] = useState<string>('');
  const [invoiceMergeMode, setInvoiceMergeMode] = useState<'accumulate' | 'separate'>('accumulate');
  const [sendWhatsAppOnInvoice, setSendWhatsAppOnInvoice] = useState<boolean>(false);

  // Modal: Create / Edit Customer Profile in History Directory
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<CustomerProfile | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [profileCustomerId, setProfileCustomerId] = useState<string>('');
  const [profileAddress, setProfileAddress] = useState<string>('');
  const [profileNotes, setProfileNotes] = useState<string>('');

  // Auto Queue Runner Modal
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // New Debt Form State
  const [selectedHistoryProfileId, setSelectedHistoryProfileId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerId, setNewCustomerId] = useState<string>('');
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>('');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState<string>('FAC-001');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newAmountUsd, setNewAmountUsd] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [newCadence, setNewCadence] = useState<2 | 3>(2);
  const [newNotes, setNewNotes] = useState<string>('');

  // New Payment Form State
  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'VES'>('USD');
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<DebtPayment['paymentMethod']>('pago_movil');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Persist debts to localStorage
  const saveDebts = (updated: CustomerDebt[]) => {
    setDebts(updated);
    localStorage.setItem('ms_morales_customer_debts', JSON.stringify(updated));
  };

  // Persist customer profiles to localStorage
  const saveCustomerProfiles = (updated: CustomerProfile[]) => {
    setCustomerProfiles(updated);
    localStorage.setItem('ms_morales_customers_directory', JSON.stringify(updated));
  };

  // Automatically synchronize any existing customers from debts into customerProfiles directory
  useEffect(() => {
    if (debts.length === 0) return;
    setCustomerProfiles((prevProfiles) => {
      const updated = [...prevProfiles];
      let changed = false;

      debts.forEach((d) => {
        const cleanName = d.customerName.trim();
        if (!cleanName) return;

        const existingIndex = updated.findIndex(
          (p) =>
            p.id === d.customerProfileId ||
            p.name.toLowerCase() === cleanName.toLowerCase() ||
            (d.customerId && p.customerId && p.customerId.toLowerCase() === d.customerId.trim().toLowerCase())
        );

        if (existingIndex === -1) {
          updated.push({
            id: d.customerProfileId || `cust-${d.id}`,
            name: cleanName,
            phone: d.customerPhone || '',
            customerId: d.customerId || '',
            address: d.customerAddress || '',
            notes: d.notes || '',
            createdAt: d.createdAt || new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString(),
          });
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('ms_morales_customers_directory', JSON.stringify(updated));
        return updated;
      }
      return prevProfiles;
    });
  }, [debts]);

  // Helper to upsert a customer profile into the history directory
  const upsertCustomerInHistory = (data: {
    name: string;
    phone: string;
    customerId?: string;
    address?: string;
    notes?: string;
    preferredId?: string;
  }): CustomerProfile => {
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.trim();
    const cleanCid = (data.customerId || '').trim();
    const cleanAddress = (data.address || '').trim();
    const cleanNotes = (data.notes || '').trim();
    const nowIso = new Date().toISOString();

    const existingIdx = customerProfiles.findIndex(
      (p) =>
        (data.preferredId && p.id === data.preferredId) ||
        p.name.toLowerCase() === cleanName.toLowerCase() ||
        (cleanCid && p.customerId && p.customerId.toLowerCase() === cleanCid.toLowerCase())
    );

    if (existingIdx >= 0) {
      const existing = customerProfiles[existingIdx];
      const updatedProfile: CustomerProfile = {
        ...existing,
        name: cleanName || existing.name,
        phone: cleanPhone || existing.phone,
        customerId: cleanCid || existing.customerId,
        address: cleanAddress || existing.address,
        notes: cleanNotes || existing.notes,
        updatedAt: nowIso,
      };
      const nextList = [...customerProfiles];
      nextList[existingIdx] = updatedProfile;
      saveCustomerProfiles(nextList);
      return updatedProfile;
    } else {
      const newProfile: CustomerProfile = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        phone: cleanPhone,
        customerId: cleanCid,
        address: cleanAddress,
        notes: cleanNotes,
        createdAt: nowIso.split('T')[0],
        updatedAt: nowIso,
      };
      saveCustomerProfiles([newProfile, ...customerProfiles]);
      return newProfile;
    }
  };

  const handleUpdateCadence = (newDays: 2 | 3) => {
    setGlobalCadence(newDays);
    localStorage.setItem('ms_morales_debt_cadence', newDays.toString());
  };

  // Enriched debts with real-time balance, normalized invoices, and notification eligibility
  const enrichedDebts = useMemo(() => {
    return debts.map((d) => {
      const balance = getDebtBalanceInfo(d, effectiveRate);
      const eligibility = checkDebtNotificationEligibility(d, effectiveRate, globalCadence);
      const invoices = getDebtInvoices(d);
      return {
        ...d,
        invoices,
        balance,
        eligibility,
      };
    });
  }, [debts, effectiveRate, globalCadence]);

  // Enriched Customer History Directory with aggregated invoices, payments, and balances
  const enrichedCustomerHistory = useMemo(() => {
    return customerProfiles.map((profile) => {
      const clientDebts = enrichedDebts.filter(
        (d) =>
          d.customerProfileId === profile.id ||
          d.customerName.trim().toLowerCase() === profile.name.trim().toLowerCase() ||
          (profile.customerId &&
            d.customerId &&
            d.customerId.trim().toLowerCase() === profile.customerId.trim().toLowerCase())
      );

      let totalBilledUsd = 0;
      let totalPaidUsd = 0;
      let totalPendingUsd = 0;
      const allInvoices: (DebtInvoice & { debtId: string })[] = [];
      const allPayments: (DebtPayment & { debtId: string; debtDescription: string })[] = [];

      clientDebts.forEach((d) => {
        totalBilledUsd += d.originalAmountUsd;
        totalPaidUsd += d.balance.totalPaidUsd;
        totalPendingUsd += d.balance.remainingUsd;

        d.invoices.forEach((inv) => {
          allInvoices.push({ ...inv, debtId: d.id });
        });
        d.payments.forEach((pay) => {
          allPayments.push({ ...pay, debtId: d.id, debtDescription: d.description });
        });
      });

      const primaryActiveDebt = clientDebts.find((d) => d.balance.remainingUsd > 0.01) || clientDebts[0] || null;

      return {
        profile,
        clientDebts,
        primaryActiveDebt,
        totalBilledUsd,
        totalBilledVes: totalBilledUsd * effectiveRate,
        totalPaidUsd,
        totalPaidVes: totalPaidUsd * effectiveRate,
        totalPendingUsd,
        totalPendingVes: totalPendingUsd * effectiveRate,
        allInvoices,
        allPayments,
      };
    });
  }, [customerProfiles, enrichedDebts, effectiveRate]);

  // Filtered Customer History
  const filteredCustomerHistory = useMemo(() => {
    if (!customerSearchQuery.trim()) return enrichedCustomerHistory;
    const q = customerSearchQuery.toLowerCase();
    return enrichedCustomerHistory.filter(
      (item) =>
        item.profile.name.toLowerCase().includes(q) ||
        (item.profile.phone && item.profile.phone.toLowerCase().includes(q)) ||
        (item.profile.customerId && item.profile.customerId.toLowerCase().includes(q)) ||
        (item.profile.address && item.profile.address.toLowerCase().includes(q))
    );
  }, [enrichedCustomerHistory, customerSearchQuery]);

  // Debts requiring automated alert today
  const pendingNotificationDebts = useMemo(() => {
    return enrichedDebts.filter((d) => d.eligibility.shouldNotifyToday);
  }, [enrichedDebts]);

  // Summary Metrics & Grand Total Analysis
  const metrics = useMemo(() => {
    let totalOriginalUsd = 0;
    let totalCollectedUsd = 0;
    let totalPendingUsd = 0;
    let totalInvoicesCount = 0;

    let pendingCurrentUsd = 0;
    let pendingDueTomorrowUsd = 0;
    let pendingDueTodayUsd = 0;
    let pendingOverdueUsd = 0;

    let countDueTomorrow = 0;
    let countDueToday = 0;
    let countOverdue = 0;
    let countCurrent = 0;
    let countActive = 0;
    let countPaid = 0;
    let countRequiresAlertToday = 0;

    enrichedDebts.forEach((d) => {
      totalOriginalUsd += d.originalAmountUsd;
      totalCollectedUsd += d.balance.totalPaidUsd;
      totalPendingUsd += d.balance.remainingUsd;
      totalInvoicesCount += d.invoices.length;

      if (d.balance.remainingUsd <= 0.01) {
        countPaid++;
      } else {
        countActive++;
        if (d.balance.urgencyStatus === 'due_tomorrow') {
          countDueTomorrow++;
          pendingDueTomorrowUsd += d.balance.remainingUsd;
        } else if (d.balance.urgencyStatus === 'due_today') {
          countDueToday++;
          pendingDueTodayUsd += d.balance.remainingUsd;
        } else if (d.balance.urgencyStatus === 'overdue') {
          countOverdue++;
          pendingOverdueUsd += d.balance.remainingUsd;
        } else {
          countCurrent++;
          pendingCurrentUsd += d.balance.remainingUsd;
        }
      }

      if (d.eligibility.shouldNotifyToday) {
        countRequiresAlertToday++;
      }
    });

    const totalOriginalVes = totalOriginalUsd * effectiveRate;
    const totalCollectedVes = totalCollectedUsd * effectiveRate;
    const totalPendingVes = totalPendingUsd * effectiveRate;
    const pendingCurrentVes = pendingCurrentUsd * effectiveRate;
    const pendingDueTomorrowVes = pendingDueTomorrowUsd * effectiveRate;
    const pendingDueTodayVes = pendingDueTodayUsd * effectiveRate;
    const pendingOverdueVes = pendingOverdueUsd * effectiveRate;
    const recoveryRate = totalOriginalUsd > 0 ? (totalCollectedUsd / totalOriginalUsd) * 100 : 0;

    return {
      totalOriginalUsd,
      totalOriginalVes,
      totalCollectedUsd,
      totalCollectedVes,
      totalPendingUsd,
      totalPendingVes,
      totalInvoicesCount,
      pendingCurrentUsd,
      pendingCurrentVes,
      pendingDueTomorrowUsd,
      pendingDueTomorrowVes,
      pendingDueTodayUsd,
      pendingDueTodayVes,
      pendingOverdueUsd,
      pendingOverdueVes,
      countDueTomorrow,
      countDueToday,
      countOverdue,
      countCurrent,
      countActive,
      countPaid,
      totalCount: enrichedDebts.length,
      countRequiresAlertToday,
      recoveryRate,
    };
  }, [enrichedDebts, effectiveRate]);

  // Filtered Debts List
  const filteredDebts = useMemo(() => {
    return enrichedDebts.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesInvoice = d.invoices.some(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) || inv.description.toLowerCase().includes(q)
      );
      const matchesSearch =
        d.customerName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        matchesInvoice ||
        (d.customerPhone && d.customerPhone.includes(searchQuery)) ||
        (d.customerId && d.customerId.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'requires_alert') return d.eligibility.shouldNotifyToday;
      if (filterStatus === 'due_tomorrow') return d.balance.urgencyStatus === 'due_tomorrow';
      if (filterStatus === 'due_today') return d.balance.urgencyStatus === 'due_today';
      if (filterStatus === 'overdue') return d.balance.urgencyStatus === 'overdue';
      if (filterStatus === 'pending') return d.balance.remainingUsd > 0.01;
      if (filterStatus === 'paid') return d.balance.remainingUsd <= 0.01;

      return true;
    });
  }, [enrichedDebts, filterStatus, searchQuery]);

  // Quick preset due dates
  const handleSetDueDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setNewDueDate(target.toISOString().split('T')[0]);
  };

  const handleSetInvoiceDueDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setInvoiceDueDateInput(target.toISOString().split('T')[0]);
  };

  // Select a client from history inside "Nueva Cuenta por Cobrar" modal
  const handleSelectProfileInNewDebt = (profileId: string) => {
    setSelectedHistoryProfileId(profileId);
    if (!profileId) return;
    const found = customerProfiles.find((p) => p.id === profileId);
    if (found) {
      setNewCustomerName(found.name);
      setNewCustomerPhone(found.phone);
      setNewCustomerId(found.customerId || '');
      setNewCustomerAddress(found.address || '');
    }
  };

  // Add New Debt (and automatically save Customer Profile in History)
  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFlexibleNumber(newAmountUsd);
    if (!newCustomerName.trim() || amount <= 0) return;

    const savedProfile = upsertCustomerInHistory({
      name: newCustomerName,
      phone: newCustomerPhone,
      customerId: newCustomerId,
      address: newCustomerAddress,
      notes: newNotes,
      preferredId: selectedHistoryProfileId || undefined,
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const initialInvoice: DebtInvoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: newInvoiceNumber.trim() || 'FAC-001',
      description: newDescription.trim() || 'Factura inicial a crédito',
      amountUsd: amount,
      rateBcvAtCreation: effectiveRate,
      date: todayStr,
      dueDate: newDueDate,
      notes: newNotes.trim(),
    };

    const newDebt: CustomerDebt = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerProfileId: savedProfile.id,
      customerName: savedProfile.name,
      customerPhone: savedProfile.phone,
      customerId: savedProfile.customerId,
      customerAddress: savedProfile.address,
      description: `${initialInvoice.invoiceNumber} - ${initialInvoice.description}`,
      originalAmountUsd: amount,
      originalRateBcv: effectiveRate,
      createdAt: todayStr,
      dueDate: newDueDate,
      invoices: [initialInvoice],
      payments: [],
      notes: newNotes.trim(),
      notificationHistory: [],
      followupCadenceDays: newCadence,
    };

    saveDebts([newDebt, ...debts]);
    setIsNewDebtOpen(false);

    // Reset fields
    setSelectedHistoryProfileId('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerId('');
    setNewCustomerAddress('');
    setNewInvoiceNumber('FAC-001');
    setNewDescription('');
    setNewAmountUsd('');
    setNewNotes('');
  };

  // Open "Incluir Nueva Factura a Cliente Existente" Modal
  const handleOpenAddInvoiceModal = (options?: { debt?: CustomerDebt; profile?: CustomerProfile }) => {
    const targetDebt = options?.debt || null;
    const targetProfile =
      options?.profile ||
      (targetDebt
        ? customerProfiles.find(
            (p) =>
              p.id === targetDebt.customerProfileId ||
              p.name.toLowerCase() === targetDebt.customerName.toLowerCase()
          ) || null
        : customerProfiles[0] || null);

    // Find active debt if only profile was passed
    const resolvedDebt =
      targetDebt ||
      (targetProfile
        ? debts.find(
            (d) =>
              d.customerProfileId === targetProfile.id ||
              d.customerName.toLowerCase() === targetProfile.name.toLowerCase()
          ) || null
        : debts[0] || null);

    const existingInvs = resolvedDebt ? getDebtInvoices(resolvedDebt) : [];
    const nextInvNum = `FAC-${String(existingInvs.length + 1).padStart(3, '0')}`;

    setSelectedDebtIdForInvoice(resolvedDebt ? resolvedDebt.id : '');
    setSelectedProfileIdForInvoice(targetProfile ? targetProfile.id : '');
    setInvoiceNumberInput(nextInvNum);
    setInvoiceDescriptionInput('');
    setInvoiceCurrency('USD');
    setInvoiceAmountInput('');
    setInvoiceNotesInput('');
    setInvoiceMergeMode('accumulate');
    setSendWhatsAppOnInvoice(false);

    // Default due date: if resolvedDebt is active, keep its due date; if paid or none, +7 days
    if (resolvedDebt) {
      const bal = getDebtBalanceInfo(resolvedDebt, effectiveRate);
      if (bal.remainingUsd > 0.01 && resolvedDebt.dueDate) {
        setInvoiceDueDateInput(resolvedDebt.dueDate);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setInvoiceDueDateInput(d.toISOString().split('T')[0]);
      }
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setInvoiceDueDateInput(d.toISOString().split('T')[0]);
    }

    setIsAddInvoiceModalOpen(true);
  };

  // Handle changing target client inside Add Invoice modal
  const handleSelectClientForInvoice = (value: string) => {
    // value can be `debt:${id}` or `profile:${id}`
    if (value.startsWith('debt:')) {
      const dId = value.replace('debt:', '');
      const foundDebt = debts.find((d) => d.id === dId);
      setSelectedDebtIdForInvoice(dId);
      if (foundDebt) {
        const invs = getDebtInvoices(foundDebt);
        setInvoiceNumberInput(`FAC-${String(invs.length + 1).padStart(3, '0')}`);
        const bal = getDebtBalanceInfo(foundDebt, effectiveRate);
        if (bal.remainingUsd > 0.01 && foundDebt.dueDate) {
          setInvoiceDueDateInput(foundDebt.dueDate);
        }
        const prof = customerProfiles.find(
          (p) =>
            p.id === foundDebt.customerProfileId ||
            p.name.toLowerCase() === foundDebt.customerName.toLowerCase()
        );
        setSelectedProfileIdForInvoice(prof ? prof.id : '');
      }
    } else if (value.startsWith('profile:')) {
      const pId = value.replace('profile:', '');
      setSelectedProfileIdForInvoice(pId);
      const prof = customerProfiles.find((p) => p.id === pId);
      if (prof) {
        const matchingDebt = debts.find(
          (d) =>
            d.customerProfileId === prof.id ||
            d.customerName.toLowerCase() === prof.name.toLowerCase()
        );
        setSelectedDebtIdForInvoice(matchingDebt ? matchingDebt.id : '');
        const invs = matchingDebt ? getDebtInvoices(matchingDebt) : [];
        setInvoiceNumberInput(`FAC-${String(invs.length + 1).padStart(3, '0')}`);
      }
    }
  };

  // Save New Invoice for Existing Client
  const handleSaveNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseFlexibleNumber(invoiceAmountInput);
    if (rawAmount <= 0 || !invoiceDescriptionInput.trim()) return;

    const amountUsd =
      invoiceCurrency === 'USD'
        ? rawAmount
        : effectiveRate > 0
        ? rawAmount / effectiveRate
        : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDebt = debts.find((d) => d.id === selectedDebtIdForInvoice) || null;
    const targetProfile =
      customerProfiles.find((p) => p.id === selectedProfileIdForInvoice) ||
      (targetDebt
        ? customerProfiles.find(
            (p) =>
              p.id === targetDebt.customerProfileId ||
              p.name.toLowerCase() === targetDebt.customerName.toLowerCase()
          ) || null
        : null);

    if (!targetDebt && !targetProfile) return;

    // Ensure customer profile is updated in history
    const savedProfile = upsertCustomerInHistory({
      name: targetDebt ? targetDebt.customerName : targetProfile!.name,
      phone: targetDebt ? targetDebt.customerPhone : targetProfile!.phone,
      customerId: targetDebt ? targetDebt.customerId : targetProfile!.customerId,
      address: targetDebt ? targetDebt.customerAddress : targetProfile!.address,
      preferredId: targetProfile?.id,
    });

    const newInvoice: DebtInvoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: invoiceNumberInput.trim() || 'FAC-NUEVA',
      description: invoiceDescriptionInput.trim(),
      amountUsd,
      rateBcvAtCreation: effectiveRate,
      date: todayStr,
      dueDate: invoiceDueDateInput,
      notes: invoiceNotesInput.trim(),
    };

    if (targetDebt && invoiceMergeMode === 'accumulate') {
      // Accumulate into the existing customer's account
      const currentInvoices = getDebtInvoices(targetDebt);
      const updatedInvoices = [...currentInvoices, newInvoice];
      const updatedTotalOriginalUsd = targetDebt.originalAmountUsd + amountUsd;
      const updatedDescription = `${updatedInvoices.length} Facturas (${updatedInvoices
        .map((i) => i.invoiceNumber)
        .join(', ')}) · Última: ${newInvoice.description}`;

      const updatedDebt: CustomerDebt = {
        ...targetDebt,
        customerProfileId: savedProfile.id,
        customerName: savedProfile.name,
        customerPhone: savedProfile.phone,
        customerId: savedProfile.customerId,
        customerAddress: savedProfile.address,
        description: updatedDescription,
        originalAmountUsd: updatedTotalOriginalUsd,
        dueDate: invoiceDueDateInput || targetDebt.dueDate,
        invoices: updatedInvoices,
        notes: invoiceNotesInput.trim()
          ? `${targetDebt.notes ? targetDebt.notes + ' | ' : ''}${invoiceNotesInput.trim()}`
          : targetDebt.notes,
      };

      const nextDebts = debts.map((d) => (d.id === targetDebt.id ? updatedDebt : d));
      saveDebts(nextDebts);

      // Expand the drawer on the 'invoices' tab so user immediately sees the included invoice
      setExpandedDebtId(updatedDebt.id);
      setActiveDrawerTab((prev) => ({ ...prev, [updatedDebt.id]: 'invoices' }));

      if (sendWhatsAppOnInvoice) {
        const msg = generateNewInvoiceAddedMessage(updatedDebt, newInvoice, effectiveRate, store);
        onOpenWhatsApp(msg);
      }
    } else {
      // Create as a separate account record linked to the existing client
      const createdDebt: CustomerDebt = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        customerProfileId: savedProfile.id,
        customerName: savedProfile.name,
        customerPhone: savedProfile.phone,
        customerId: savedProfile.customerId,
        customerAddress: savedProfile.address,
        description: `${newInvoice.invoiceNumber} - ${newInvoice.description}`,
        originalAmountUsd: amountUsd,
        originalRateBcv: effectiveRate,
        createdAt: todayStr,
        dueDate: invoiceDueDateInput,
        invoices: [newInvoice],
        payments: [],
        notes: invoiceNotesInput.trim(),
        notificationHistory: [],
        followupCadenceDays: globalCadence,
      };

      saveDebts([createdDebt, ...debts]);
      setExpandedDebtId(createdDebt.id);
      setActiveDrawerTab((prev) => ({ ...prev, [createdDebt.id]: 'invoices' }));

      if (sendWhatsAppOnInvoice) {
        const msg = generateNewInvoiceAddedMessage(createdDebt, newInvoice, effectiveRate, store);
        onOpenWhatsApp(msg);
      }
    }

    setIsAddInvoiceModalOpen(false);
  };

  // Open Create / Edit Customer Profile Modal
  const handleOpenProfileModal = (profile?: CustomerProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setProfileName(profile.name);
      setProfilePhone(profile.phone);
      setProfileCustomerId(profile.customerId || '');
      setProfileAddress(profile.address || '');
      setProfileNotes(profile.notes || '');
    } else {
      setEditingProfile(null);
      setProfileName('');
      setProfilePhone('');
      setProfileCustomerId('');
      setProfileAddress('');
      setProfileNotes('');
    }
    setIsProfileModalOpen(true);
  };

  // Save Customer Profile in Directory (and propagate updates to linked debts)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const saved = upsertCustomerInHistory({
      name: profileName,
      phone: profilePhone,
      customerId: profileCustomerId,
      address: profileAddress,
      notes: profileNotes,
      preferredId: editingProfile?.id,
    });

    // Sync updated customer data onto any matching debts
    if (editingProfile) {
      const syncedDebts = debts.map((d) => {
        if (
          d.customerProfileId === saved.id ||
          d.customerName.toLowerCase() === editingProfile.name.toLowerCase()
        ) {
          return {
            ...d,
            customerProfileId: saved.id,
            customerName: saved.name,
            customerPhone: saved.phone,
            customerId: saved.customerId,
            customerAddress: saved.address,
          };
        }
        return d;
      });
      saveDebts(syncedDebts);
    }

    setIsProfileModalOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    setCustomerProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem('ms_morales_customers_directory', JSON.stringify(next));
      return next;
    });
  };

  // Open Payment Modal
  const handleOpenPayment = (debt: CustomerDebt) => {
    setSelectedDebtForPayment(debt);
    const balance = getDebtBalanceInfo(debt, effectiveRate);
    setPaymentAmountInput(balance.remainingUsd.toFixed(2));
    setPaymentCurrency('USD');
    setPaymentReference('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Save Payment (Abono)
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;

    const rawAmount = parseFlexibleNumber(paymentAmountInput);
    if (rawAmount <= 0) return;

    const amountUsd = paymentCurrency === 'USD' ? rawAmount : rawAmount / effectiveRate;
    const amountVes = paymentCurrency === 'VES' ? rawAmount : rawAmount * effectiveRate;

    const newPayment: DebtPayment = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
      amountUsd,
      amountVes,
      rateUsed: effectiveRate,
      paymentMethod,
      referenceNumber: paymentReference.trim(),
      notes: paymentNotes.trim(),
    };

    let updatedDebtForReceipt: CustomerDebt = selectedDebtForPayment;

    const updated = debts.map((d) => {
      if (d.id === selectedDebtForPayment.id) {
        const nextDebt = {
          ...d,
          payments: [newPayment, ...d.payments],
        };
        updatedDebtForReceipt = nextDebt;
        return nextDebt;
      }
      return d;
    });

    saveDebts(updated);
    setIsPaymentModalOpen(false);

    // Generate receipt with updated debt
    const message = generateDebtPaymentReceiptMessage(updatedDebtForReceipt, newPayment, effectiveRate, store);
    onOpenWhatsApp(message);
  };

  // Dispatch individual debt alert and register record in notificationHistory
  const handleSendReminder = (debt: CustomerDebt, customNote?: string) => {
    const eligibility = checkDebtNotificationEligibility(debt, effectiveRate, globalCadence);
    const attemptNumber = eligibility.attemptNumber || 1;
    const alertType =
      eligibility.alertType === 'due_tomorrow'
        ? 'due_tomorrow'
        : eligibility.alertType === 'due_today'
        ? 'due_today'
        : 'overdue_followup';

    const message = generateDebtReminderMessage(debt, effectiveRate, store, {
      attemptNumber,
      cadenceDays: debt.followupCadenceDays || globalCadence,
      customNote,
      overrideType: alertType,
    });

    onOpenWhatsApp(message);

    const nowIso = new Date().toISOString();
    const balance = getDebtBalanceInfo(debt, effectiveRate);

    const newRecord: DebtNotificationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentAt: nowIso,
      type: alertType,
      attemptNumber,
      balanceUsdAtAlert: balance.remainingUsd,
      balanceVesAtAlert: balance.remainingVes,
      rateBcvUsed: effectiveRate,
      note: customNote || eligibility.reasonLabel,
    };

    const updated = debts.map((d) => {
      if (d.id === debt.id) {
        const history = d.notificationHistory || [];
        return {
          ...d,
          lastNotificationSentAt: nowIso,
          notificationHistory: [newRecord, ...history],
        };
      }
      return d;
    });

    saveDebts(updated);
  };

  // Launch Automated Notification Queue
  const handleStartQueue = () => {
    if (pendingNotificationDebts.length === 0) return;
    setCurrentQueueIndex(0);
    setIsQueueModalOpen(true);
  };

  const handleQueueSendCurrent = () => {
    const target = pendingNotificationDebts[currentQueueIndex];
    if (!target) return;

    handleSendReminder(target);

    if (currentQueueIndex + 1 < pendingNotificationDebts.length) {
      setCurrentQueueIndex((prev) => prev + 1);
    } else {
      setIsQueueModalOpen(false);
    }
  };

  const handleQueueSkipCurrent = () => {
    if (currentQueueIndex + 1 < pendingNotificationDebts.length) {
      setCurrentQueueIndex((prev) => prev + 1);
    } else {
      setIsQueueModalOpen(false);
    }
  };

  // Share general receivables report
  const handleShareGeneralReport = () => {
    const message = generateGeneralReceivablesReportMessage(debts, effectiveRate, store);
    onOpenWhatsApp(message);
  };

  const handleCopyGeneralReport = async () => {
    const message = generateGeneralReceivablesReportMessage(debts, effectiveRate, store);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Delete Debt
  const handleDeleteDebt = (id: string) => {
    saveDebts(debts.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* PANEL EJECUTIVO: TOTAL GENERAL DE COBRANZA Y CARTERA POR COBRAR */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white rounded-3xl p-6 sm:p-7 border border-neutral-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Tag & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block">
                  MS Morales System Soluciones · Balance General de Cartera
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Total General de Cuentas por Cobrar
                </h2>
              </div>
            </div>

            {/* Quick Share / Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGeneralReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-bold transition-all border border-neutral-700 shadow-xs cursor-pointer"
                title="Copiar balance general de cobranza al portapapeles"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copiar Balance</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareGeneralReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                title="Enviar reporte consolidado de cartera por WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar Reporte WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Main Hero Figures: Saldo Total por Cobrar en USD y en Bolívares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950/70 p-5 sm:p-6 rounded-2xl border border-neutral-800/80">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Saldo Total por Cobrar en Dólares:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tabular-nums tracking-tight">
                  {formatUsd(metrics.totalPendingUsd)}
                </span>
                <span className="text-sm font-bold text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Acumulado de {metrics.countActive} {metrics.countActive === 1 ? 'cuenta activa' : 'cuentas activas'} ({metrics.totalInvoicesCount} {metrics.totalInvoicesCount === 1 ? 'factura registrada' : 'facturas registradas'} · {customerProfiles.length} {customerProfiles.length === 1 ? 'cliente en historial' : 'clientes en historial'}).
              </p>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Equivalente Oficial a la Fecha en Bolívares:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-emerald-400 tabular-nums tracking-tight">
                  {formatVes(metrics.totalPendingVes)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-300 font-mono">
                <span>🏦 Tasa Oficial BCV: Bs. {effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD</span>
                <span>·</span>
                <span className="text-neutral-400 font-sans">Liquidación al día de hoy</span>
              </div>
            </div>
          </div>

          {/* Gran Resumen del Dinero de la Cartera */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-neutral-800/50 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Total Facturado ({metrics.totalInvoicesCount} Facturas)
              </span>
              <div className="font-mono font-bold text-sm sm:text-base text-neutral-200 tabular-nums">
                {formatUsd(metrics.totalOriginalUsd)}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 block tabular-nums">
                {formatVes(metrics.totalOriginalVes)}
              </span>
            </div>

            <div className="bg-neutral-800/50 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Total Cobrado (Abonos)
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {metrics.recoveryRate.toFixed(1)}%
                </span>
              </div>
              <div className="font-mono font-bold text-sm sm:text-base text-emerald-400 tabular-nums">
                {formatUsd(metrics.totalCollectedUsd)}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 block tabular-nums">
                {formatVes(metrics.totalCollectedVes)}
              </span>
            </div>

            <div className="bg-neutral-800/50 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">
                Cartera al Día / Vigente
              </span>
              <div className="font-mono font-bold text-sm sm:text-base text-sky-300 tabular-nums">
                {formatUsd(metrics.pendingCurrentUsd)}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 block tabular-nums">
                {formatVes(metrics.pendingCurrentVes)} · {metrics.countCurrent} ctas
              </span>
            </div>

            <div className="bg-neutral-800/50 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                Cartera Vencida (Mora)
              </span>
              <div className="font-mono font-bold text-sm sm:text-base text-red-400 tabular-nums">
                {formatUsd(metrics.pendingOverdueUsd)}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 block tabular-nums">
                {formatVes(metrics.pendingOverdueVes)} · {metrics.countOverdue} ctas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Collections Assistant & Cadence Config Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-900 dark:to-neutral-950 text-white rounded-3xl p-5 sm:p-6 border border-neutral-700/60 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <BellRing className="w-4 h-4 animate-bounce" />
              </span>
              <h2 className="text-sm font-black tracking-wide uppercase text-emerald-400">
                Asistente Automático de Cobranzas y Alertas WhatsApp
              </h2>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Notificaciones 1 día antes y seguimiento recurrente cada 2 a 3 días
            </h3>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              El sistema detecta automáticamente cuentas que vencen <strong>mañana</strong> y emite la alerta preventiva con el desglose de todas las facturas del cliente en dólares y bolívares al BCV. Si el cliente no abona, repite alertas periódicas cada <strong>2 a 3 días</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <div className="bg-neutral-800/80 p-2.5 rounded-2xl border border-neutral-700 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-neutral-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-emerald-400" />
                  Ciclo de seguimiento en mora:
                </span>
                <span className="font-bold text-white">Cada {globalCadence} días</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateCadence(2)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    globalCadence === 2
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Cada 2 Días
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCadence(3)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    globalCadence === 3
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Cada 3 Días
                </button>
              </div>
            </div>

            {metrics.countRequiresAlertToday > 0 ? (
              <button
                type="button"
                onClick={handleStartQueue}
                className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 fill-neutral-950" />
                <span>
                  Enviar {metrics.countRequiresAlertToday} {metrics.countRequiresAlertToday === 1 ? 'Alerta Hoy' : 'Alertas Hoy'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-4 py-3 bg-neutral-800/80 border border-neutral-700 rounded-2xl text-xs text-neutral-400 flex items-center gap-2 text-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cobranzas al día hoy</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE NAVEGACIÓN INTERNA: CUENTAS POR COBRAR VS HISTORIAL   */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('debts')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'debts'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span>Cuentas por Cobrar y Facturas ({debts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('customers')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'customers'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Historial y Directorio de Clientes ({customerProfiles.length})</span>
          </button>
        </div>

        {/* Action Buttons: Include New Invoice in Existing Client + New Account */}
        <div className="flex flex-wrap items-center gap-2">
          {(debts.length > 0 || customerProfiles.length > 0) && (
            <button
              type="button"
              onClick={() => handleOpenAddInvoiceModal()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Incluir una nueva factura a un cliente ya registrado"
            >
              <FilePlus className="w-4 h-4 text-emerald-400" />
              <span>+ Incluir Factura a Cliente Existente</span>
            </button>
          )}

          <button
            onClick={() => setIsNewDebtOpen(true)}
            type="button"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta por Cobrar</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: CUENTAS POR COBRAR Y FACTURAS                         */}
      {/* ============================================================== */}
      {activeView === 'debts' && (
        <>
          {/* Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Todas las Cuentas' },
                { id: 'requires_alert', label: `🔔 Alerta Hoy (${metrics.countRequiresAlertToday})` },
                { id: 'due_tomorrow', label: `🚨 Vencen Mañana (${metrics.countDueTomorrow})` },
                { id: 'due_today', label: `⚠️ Vencen Hoy (${metrics.countDueToday})` },
                { id: 'overdue', label: `❗ Vencidas (${metrics.countOverdue})` },
                { id: 'pending', label: 'Pendientes' },
                { id: 'paid', label: 'Pagadas' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, RIF, N° factura..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400"
              />
            </div>
          </div>

          {/* Debts List */}
          <div className="space-y-3">
            {filteredDebts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <UserCheck className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  No se encontraron cuentas por cobrar
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {filterStatus !== 'all'
                    ? 'No hay cuentas con el filtro seleccionado.'
                    : 'Comienza registrando tu primera cuenta por cobrar o selecciona un cliente del historial.'}
                </p>
              </div>
            ) : (
              filteredDebts.map((debt) => {
                const isExpanded = expandedDebtId === debt.id;
                const currentTab = activeDrawerTab[debt.id] || 'invoices';
                const isDueTomorrow = debt.balance.urgencyStatus === 'due_tomorrow';
                const isOverdue = debt.balance.urgencyStatus === 'overdue';
                const isDueToday = debt.balance.urgencyStatus === 'due_today';
                const isPaid = debt.balance.urgencyStatus === 'paid';
                const needsAlertToday = debt.eligibility.shouldNotifyToday;
                const cadence = debt.followupCadenceDays || globalCadence;
                const notificationsCount =
                  debt.notificationHistory?.length || (debt.lastNotificationSentAt ? 1 : 0);
                const invoicesList = debt.invoices;

                return (
                  <div
                    key={debt.id}
                    className={`bg-white dark:bg-neutral-900 rounded-2xl border transition-all ${
                      needsAlertToday
                        ? 'border-amber-400 dark:border-amber-500/80 ring-2 ring-amber-400/20 shadow-md'
                        : isDueTomorrow
                        ? 'border-amber-400 dark:border-amber-600/80 shadow-xs'
                        : isOverdue
                        ? 'border-red-400 dark:border-red-700 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {/* Main Card Header / Row */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Left: Customer & Debt description & Badges */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            {debt.customerName}
                          </h3>
                          {debt.customerId && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              ({debt.customerId})
                            </span>
                          )}

                          {/* Invoices Count Badge */}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedDebtId(debt.id);
                              setActiveDrawerTab((prev) => ({ ...prev, [debt.id]: 'invoices' }));
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20"
                            title="Ver facturas incluidas en esta cuenta"
                          >
                            <FileText className="w-3 h-3" />
                            <span>
                              {invoicesList.length} {invoicesList.length === 1 ? 'Factura' : 'Facturas'}
                            </span>
                          </button>

                          {/* Status Badges */}
                          {isDueTomorrow && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white rounded">
                              🚨 Vence Mañana (1 día)
                            </span>
                          )}
                          {isDueToday && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white rounded">
                              ⚠️ Vence Hoy
                            </span>
                          )}
                          {isOverdue && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded">
                              ❗ Vencida ({Math.abs(debt.balance.daysDiff)} días de mora)
                            </span>
                          )}
                          {isPaid && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded">
                              ✓ Solvente / Pagada
                            </span>
                          )}
                          {!isDueTomorrow && !isDueToday && !isOverdue && !isPaid && (
                            <span className="px-2 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded">
                              Faltan {debt.balance.daysDiff} días
                            </span>
                          )}

                          {needsAlertToday && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded animate-pulse flex items-center gap-1">
                              <Bell className="w-2.5 h-2.5" />
                              Alerta Pendiente Hoy
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                          {debt.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span>Tel: {debt.customerPhone || 'Sin teléfono'}</span>
                          <span>·</span>
                          <span>Creada: {debt.createdAt}</span>
                          <span>·</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                            Vence: {debt.dueDate}
                          </span>
                          <span>·</span>
                          <span className="text-neutral-500">
                            Seguimiento: cada {cadence} días
                          </span>
                        </div>

                        <div className="text-[11px] pt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-neutral-500">{debt.eligibility.reasonLabel}</span>
                          {debt.eligibility.nextScheduledDate && (
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              (Próximo aviso: {debt.eligibility.nextScheduledDate})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Center: Balances in USD and live VES */}
                      <div className="text-left md:text-right shrink-0 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 min-w-[215px]">
                        <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
                          <span className="text-neutral-400 font-medium">Saldo Pendiente:</span>
                          <span className="text-lg font-mono font-black text-neutral-900 dark:text-white tabular-nums">
                            {formatUsd(debt.balance.remainingUsd)}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                          {formatVes(debt.balance.remainingVes)}
                        </div>

                        <div className="mt-1 text-[10px] text-neutral-400 flex items-center justify-between md:justify-end gap-2">
                          <span>Facturado: {formatUsd(debt.originalAmountUsd)}</span>
                          <span>·</span>
                          <span>Abonado: {formatUsd(debt.balance.totalPaidUsd)}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto justify-end">
                        {/* Add New Invoice to this Existing Client */}
                        <button
                          onClick={() => handleOpenAddInvoiceModal({ debt })}
                          type="button"
                          title="Incluir una nueva factura a este cliente existente"
                          className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
                        >
                          <FilePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+ Factura</span>
                        </button>

                        {/* Register Payment */}
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenPayment(debt)}
                            type="button"
                            className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Abonar</span>
                          </button>
                        )}

                        {/* Notify via WhatsApp */}
                        <button
                          onClick={() => handleSendReminder(debt)}
                          type="button"
                          title="Enviar alerta formal con desglose de facturas y saldo por WhatsApp"
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                            needsAlertToday
                              ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black animate-pulse'
                              : isOverdue
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>
                            {needsAlertToday
                              ? 'Enviar Alerta Hoy'
                              : isDueTomorrow
                              ? 'Alerta Vence Mañana'
                              : isOverdue
                              ? 'Alerta de Mora'
                              : 'WhatsApp'}
                          </span>
                        </button>

                        {/* Toggle History Drawer */}
                        <button
                          onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                          type="button"
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Ver facturas incluidas, historial de abonos y alertas"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          type="button"
                          className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Drawer: Tabs for Invoices, Payments, and Notifications */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 bg-neutral-50/70 dark:bg-neutral-950/50 rounded-b-2xl space-y-3">
                        {/* Drawer Tab Headers */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveDrawerTab((prev) => ({ ...prev, [debt.id]: 'invoices' }))}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentTab === 'invoices'
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Facturas Incluidas ({invoicesList.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveDrawerTab((prev) => ({ ...prev, [debt.id]: 'payments' }))}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentTab === 'payments'
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Historial de Abonos ({debt.payments.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveDrawerTab((prev) => ({ ...prev, [debt.id]: 'notifications' }))}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentTab === 'notifications'
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>Alertas Enviadas ({notificationsCount})</span>
                            </button>
                          </div>

                          {currentTab === 'invoices' && (
                            <button
                              onClick={() => handleOpenAddInvoiceModal({ debt })}
                              type="button"
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>+ Incluir Nueva Factura a {debt.customerName}</span>
                            </button>
                          )}

                          {currentTab === 'payments' && !isPaid && (
                            <button
                              onClick={() => handleOpenPayment(debt)}
                              type="button"
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registrar Abono</span>
                            </button>
                          )}

                          {currentTab === 'notifications' && (
                            <button
                              onClick={() => handleSendReminder(debt)}
                              type="button"
                              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disparar Nueva Alerta Ahora</span>
                            </button>
                          )}
                        </div>

                        {/* Content: Invoices Tab */}
                        {currentTab === 'invoices' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-left">
                                  <th className="pb-2">Fecha</th>
                                  <th className="pb-2">N° Factura / Nota</th>
                                  <th className="pb-2">Concepto / Detalle</th>
                                  <th className="pb-2 text-right">Monto ($)</th>
                                  <th className="pb-2 text-right">Equivalente Hoy (Bs.)</th>
                                  <th className="pb-2 text-right">Tasa Emisión</th>
                                  <th className="pb-2 text-center">Notificar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-mono">
                                {invoicesList.map((inv, idx) => (
                                  <tr key={inv.id || idx} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40">
                                    <td className="py-2 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                                      {inv.date}
                                    </td>
                                    <td className="py-2 font-bold text-emerald-700 dark:text-emerald-400">
                                      {inv.invoiceNumber || `FAC-00${idx + 1}`}
                                    </td>
                                    <td className="py-2 font-sans text-neutral-700 dark:text-neutral-300">
                                      {inv.description}
                                      {inv.notes && (
                                        <span className="block text-[10px] text-neutral-400">
                                          Nota: {inv.notes}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                                      {formatUsd(inv.amountUsd)}
                                    </td>
                                    <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                      {formatVes(inv.amountUsd * effectiveRate)}
                                    </td>
                                    <td className="py-2 text-right text-neutral-500 tabular-nums">
                                      Bs. {(inv.rateBcvAtCreation || effectiveRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const msg = generateNewInvoiceAddedMessage(debt, inv, effectiveRate, store);
                                          onOpenWhatsApp(msg);
                                        }}
                                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                        title="Enviar detalle de esta factura y saldo acumulado por WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Content: Payments Tab */}
                        {currentTab === 'payments' && (
                          <div>
                            {debt.payments.length === 0 ? (
                              <p className="text-xs text-neutral-500 py-3 text-center">
                                No hay abonos registrados todavía. El cliente adeuda el monto completo ($
                                {debt.originalAmountUsd.toFixed(2)} USD).
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-left">
                                      <th className="pb-2">Fecha</th>
                                      <th className="pb-2">Método</th>
                                      <th className="pb-2">Referencia</th>
                                      <th className="pb-2 text-right">Monto ($)</th>
                                      <th className="pb-2 text-right">Monto (Bs.)</th>
                                      <th className="pb-2 text-right">Tasa BCV</th>
                                      <th className="pb-2 text-center">Recibo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-mono">
                                    {debt.payments.map((p) => (
                                      <tr key={p.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40">
                                        <td className="py-2 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                                          {new Date(p.date).toLocaleDateString('es-VE')}{' '}
                                          {new Date(p.date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-2 font-sans capitalize text-neutral-600 dark:text-neutral-400">
                                          {p.paymentMethod.replace('_', ' ')}
                                        </td>
                                        <td className="py-2 text-neutral-500">
                                          {p.referenceNumber || 'N/A'}
                                        </td>
                                        <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                          +{formatUsd(p.amountUsd)}
                                        </td>
                                        <td className="py-2 text-right font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                                          +{formatVes(p.amountVes)}
                                        </td>
                                        <td className="py-2 text-right text-neutral-500 tabular-nums">
                                          Bs. {p.rateUsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 text-center">
                                          <button
                                            onClick={() => {
                                              const msg = generateDebtPaymentReceiptMessage(debt, p, effectiveRate, store);
                                              onOpenWhatsApp(msg);
                                            }}
                                            type="button"
                                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                            title="Enviar comprobante de abono al cliente vía WhatsApp"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content: Notifications Tab */}
                        {currentTab === 'notifications' && (
                          <div className="space-y-2">
                            {(!debt.notificationHistory || debt.notificationHistory.length === 0) ? (
                              <div className="py-3 text-center text-xs text-neutral-500">
                                {debt.lastNotificationSentAt ? (
                                  <p>
                                    Último aviso registrado el{' '}
                                    {new Date(debt.lastNotificationSentAt).toLocaleString('es-VE')}.
                                  </p>
                                ) : (
                                  <p>No se han emitido alertas de cobro para esta cuenta todavía.</p>
                                )}
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 text-left">
                                      <th className="pb-2">Fecha y Hora</th>
                                      <th className="pb-2">Tipo de Alerta</th>
                                      <th className="pb-2">Intento</th>
                                      <th className="pb-2 text-right">Saldo Notificado ($)</th>
                                      <th className="pb-2 text-right">Saldo en Bs.</th>
                                      <th className="pb-2 text-right">Tasa BCV</th>
                                      <th className="pb-2 text-center">Reenviar</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-mono">
                                    {debt.notificationHistory.map((n) => (
                                      <tr key={n.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40">
                                        <td className="py-2 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                                          {new Date(n.sentAt).toLocaleDateString('es-VE')}{' '}
                                          {new Date(n.sentAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-2 font-sans">
                                          {n.type === 'due_tomorrow' && (
                                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                                              🚨 Vence Mañana (-1 día)
                                            </span>
                                          )}
                                          {n.type === 'due_today' && (
                                            <span className="text-orange-600 dark:text-orange-400 font-bold">
                                              ⚠️ Vence Hoy
                                            </span>
                                          )}
                                          {n.type === 'overdue_followup' && (
                                            <span className="text-red-600 dark:text-red-400 font-bold">
                                              ❗ Seguimiento Mora (Ciclo {cadence}d)
                                            </span>
                                          )}
                                          {n.type === 'manual' && (
                                            <span className="text-neutral-500 font-medium">Manual</span>
                                          )}
                                        </td>
                                        <td className="py-2 text-neutral-500 font-bold">
                                          Aviso #{n.attemptNumber}
                                        </td>
                                        <td className="py-2 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                                          {formatUsd(n.balanceUsdAtAlert)}
                                        </td>
                                        <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                          {formatVes(n.balanceVesAtAlert)}
                                        </td>
                                        <td className="py-2 text-right text-neutral-500 tabular-nums">
                                          Bs. {n.rateBcvUsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 text-center">
                                          <button
                                            onClick={() => handleSendReminder(debt)}
                                            type="button"
                                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                            title="Reenviar alerta actualizada por WhatsApp"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: HISTORIAL Y DIRECTORIO DE CLIENTES                    */}
      {/* ============================================================== */}
      {activeView === 'customers' && (
        <div className="space-y-4">
          {/* Header & Search for Client History Directory */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Historial de Clientes Registrados ({customerProfiles.length})</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Los datos de cada cliente (Nombre, Teléfono, C.I./RIF, Dirección, Facturas y Abonos) se guardan automáticamente en este historial para futuras compras a crédito.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Buscar en historial de clientes..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenProfileModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Guardar Cliente</span>
              </button>
            </div>
          </div>

          {/* Client History Cards */}
          {filteredCustomerHistory.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                No hay clientes guardados en el historial todavía
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Al registrar una cuenta por cobrar o hacer clic en &ldquo;Guardar Cliente&rdquo;, los datos del cliente quedarán almacenados aquí con todo su récord de facturas y abonos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomerHistory.map((item) => {
                const {
                  profile,
                  clientDebts,
                  primaryActiveDebt,
                  totalBilledUsd,
                  totalPaidUsd,
                  totalPendingUsd,
                  totalPendingVes,
                  allInvoices,
                  allPayments,
                } = item;
                const isHistoryExpanded = expandedCustomerId === profile.id;
                const hasPendingBalance = totalPendingUsd > 0.01;

                return (
                  <div
                    key={profile.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Client Personal & Fiscal Data */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                            {profile.name}
                          </h4>
                          {profile.customerId && (
                            <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded">
                              {profile.customerId}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              hasPendingBalance
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {hasPendingBalance ? 'Con Saldo Pendiente' : '✓ Solvente'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            {profile.phone || 'Sin teléfono'}
                          </span>
                          {profile.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                              {profile.address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-neutral-400" />
                            {allInvoices.length} {allInvoices.length === 1 ? 'factura en historial' : 'facturas en historial'}
                          </span>
                          <span className="flex items-center gap-1">
                            <History className="w-3.5 h-3.5 text-neutral-400" />
                            {allPayments.length} {allPayments.length === 1 ? 'abono registrado' : 'abonos registrados'}
                          </span>
                        </div>

                        {profile.notes && (
                          <p className="text-[11px] text-neutral-400 italic">
                            Nota: {profile.notes}
                          </p>
                        )}
                      </div>

                      {/* Financial Summary of this Customer */}
                      <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-xs w-full lg:w-auto min-w-[300px]">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Facturado Total
                          </span>
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                            {formatUsd(totalBilledUsd)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Total Abonado
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatUsd(totalPaidUsd)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Saldo Actual
                          </span>
                          <span className="font-mono font-black text-neutral-900 dark:text-white tabular-nums block">
                            {formatUsd(totalPendingUsd)}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums block">
                            {formatVes(totalPendingVes)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions for Saved Customer */}
                      <div className="flex flex-wrap items-center gap-1.5 self-stretch lg:self-auto justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAddInvoiceModal({
                              debt: primaryActiveDebt || undefined,
                              profile,
                            })
                          }
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          <span>+ Incluir Nueva Factura</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const msg = generateCustomerHistoryStatementMessage(
                              profile,
                              clientDebts,
                              effectiveRate,
                              store
                            );
                            onOpenWhatsApp(msg);
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Enviar estado de cuenta e historial completo por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Estado de Cuenta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProfileModal(profile)}
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Editar datos guardados del cliente"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCustomerId(isHistoryExpanded ? null : profile.id)
                          }
                          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Ver historial completo de facturas y abonos del cliente"
                        >
                          {isHistoryExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Eliminar perfil del directorio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Customer Full History (Invoices + Payments) */}
                    {isHistoryExpanded && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 bg-neutral-50/70 dark:bg-neutral-950/50 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                        {/* All Historical Invoices */}
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h5 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Historial de Facturas ({allInvoices.length})</span>
                            </h5>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenAddInvoiceModal({
                                  debt: primaryActiveDebt || undefined,
                                  profile,
                                })
                              }
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              + Anexar Factura
                            </button>
                          </div>

                          {allInvoices.length === 0 ? (
                            <p className="text-neutral-500 py-2">
                              Sin facturas registradas para este cliente.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-52 overflow-y-auto">
                              {allInvoices.map((inv, i) => (
                                <div
                                  key={inv.id || i}
                                  className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0"
                                >
                                  <div>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      {inv.invoiceNumber}
                                    </span>{' '}
                                    <span className="text-neutral-400">({inv.date})</span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                      {inv.description}
                                    </p>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="font-bold text-neutral-900 dark:text-white block">
                                      {formatUsd(inv.amountUsd)}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                      {formatVes(inv.amountUsd * effectiveRate)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* All Historical Payments */}
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                            <h5 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Historial de Abonos y Pagos ({allPayments.length})</span>
                            </h5>
                          </div>

                          {allPayments.length === 0 ? (
                            <p className="text-neutral-500 py-2">
                              Sin abonos registrados para este cliente.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-52 overflow-y-auto">
                              {allPayments.map((pay, i) => (
                                <div
                                  key={pay.id || i}
                                  className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0"
                                >
                                  <div>
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                                      {pay.paymentMethod.replace('_', ' ')}
                                    </span>{' '}
                                    <span className="text-neutral-400">
                                      ({new Date(pay.date).toLocaleDateString('es-VE')})
                                    </span>
                                    {pay.referenceNumber && (
                                      <p className="text-[10px] font-mono text-neutral-500">
                                        Ref: {pay.referenceNumber}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                      +{formatUsd(pay.amountUsd)}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                      +{formatVes(pay.amountVes)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: INCLUIR NUEVA FACTURA A UN CLIENTE EXISTENTE            */}
      {/* ============================================================== */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Incluir Nueva Factura a Cliente Existente
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Anexa una nueva compra o factura al estado de cuenta e historial del cliente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewInvoice} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Selector de Cliente Existente */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Cliente Existente: *
                </label>
                <select
                  value={
                    selectedDebtIdForInvoice
                      ? `debt:${selectedDebtIdForInvoice}`
                      : selectedProfileIdForInvoice
                      ? `profile:${selectedProfileIdForInvoice}`
                      : ''
                  }
                  onChange={(e) => handleSelectClientForInvoice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-semibold"
                >
                  {debts.length > 0 && (
                    <optgroup label="Cuentas por Cobrar Registradas">
                      {debts.map((d) => {
                        const bal = getDebtBalanceInfo(d, effectiveRate);
                        return (
                          <option key={d.id} value={`debt:${d.id}`}>
                            {d.customerName} {d.customerId ? `(${d.customerId})` : ''} — Saldo actual: {formatUsd(bal.remainingUsd)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {customerProfiles.length > 0 && (
                    <optgroup label="Directorio / Historial de Clientes">
                      {customerProfiles.map((p) => (
                        <option key={p.id} value={`profile:${p.id}`}>
                          {p.name} {p.customerId ? `(${p.customerId})` : ''} — Tel: {p.phone || 'N/A'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Resumen de Datos del Cliente Seleccionado */}
              {(() => {
                const currentDebt = debts.find((d) => d.id === selectedDebtIdForInvoice);
                const currentProf = customerProfiles.find((p) => p.id === selectedProfileIdForInvoice);
                const currentBalance = currentDebt
                  ? getDebtBalanceInfo(currentDebt, effectiveRate).remainingUsd
                  : 0;
                const rawEntered = parseFlexibleNumber(invoiceAmountInput);
                const addedUsd =
                  invoiceCurrency === 'USD'
                    ? rawEntered
                    : effectiveRate > 0
                    ? rawEntered / effectiveRate
                    : 0;
                const newAccumulatedUsd =
                  invoiceMergeMode === 'accumulate' ? currentBalance + addedUsd : addedUsd;

                return (
                  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                          Datos Guardados en Historial
                        </span>
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {currentDebt?.customerName || currentProf?.name}
                        </span>
                      </div>
                      <div className="text-right font-mono text-[11px] text-neutral-500">
                        <div>{currentDebt?.customerPhone || currentProf?.phone || 'Sin teléfono'}</div>
                        {(currentDebt?.customerId || currentProf?.customerId) && (
                          <div>{currentDebt?.customerId || currentProf?.customerId}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] font-sans text-neutral-400 block">
                          Saldo Anterior:
                        </span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                          {formatUsd(currentBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-sans text-neutral-400 block">
                          + Nueva Factura:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatUsd(addedUsd)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-sans text-neutral-400 block">
                          Nuevo Saldo Total:
                        </span>
                        <span className="font-black text-neutral-900 dark:text-white block">
                          {formatUsd(newAccumulatedUsd)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          {formatVes(newAccumulatedUsd * effectiveRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* N° de Factura y Concepto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    N° Factura / Nota: *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    placeholder="FAC-002"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Concepto / Mercancía de la Factura: *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceDescriptionInput}
                    onChange={(e) => setInvoiceDescriptionInput(e.target.value)}
                    placeholder="Ej: Compra adicional de repuestos / Mercancía"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Monto de la Nueva Factura */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Monto de la Nueva Factura: *
                  </label>
                  <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setInvoiceCurrency('USD')}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        invoiceCurrency === 'USD'
                          ? 'bg-emerald-600 text-white'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceCurrency('VES')}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        invoiceCurrency === 'VES'
                          ? 'bg-emerald-600 text-white'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      VES (Bs.)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">
                    {invoiceCurrency === 'USD' ? '$' : 'Bs.'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={invoiceAmountInput}
                    onChange={(e) => setInvoiceAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 font-mono font-bold text-lg rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modo de Inclusión */}
              {selectedDebtIdForInvoice && (
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    ¿Cómo deseas registrar esta nueva factura?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceMergeMode('accumulate')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        invoiceMergeMode === 'accumulate'
                          ? 'bg-emerald-500/10 border-emerald-500 text-neutral-900 dark:text-white font-bold'
                          : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <span className="block text-xs">➕ Acumular en su Cuenta Actual</span>
                      <span className="text-[10px] font-normal text-neutral-500">
                        Suma la factura al saldo e historial de su cuenta activa
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceMergeMode('separate')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        invoiceMergeMode === 'separate'
                          ? 'bg-emerald-500/10 border-emerald-500 text-neutral-900 dark:text-white font-bold'
                          : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <span className="block text-xs">📄 Crear como Cuenta Separada</span>
                      <span className="text-[10px] font-normal text-neutral-500">
                        Registra otra fila independiente para el mismo cliente
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Fecha de Vencimiento */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Fecha de Vencimiento de la Cuenta: *
                  </label>
                  <div className="flex gap-1">
                    {[
                      { label: '+1d', days: 1 },
                      { label: '+7d', days: 7 },
                      { label: '+15d', days: 15 },
                      { label: '+30d', days: 30 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleSetInvoiceDueDays(btn.days)}
                        className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded font-semibold cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={invoiceDueDateInput}
                  onChange={(e) => setInvoiceDueDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Observación de la Factura (Opcional):
                </label>
                <input
                  type="text"
                  value={invoiceNotesInput}
                  onChange={(e) => setInvoiceNotesInput(e.target.value)}
                  placeholder="Ej: Entregado a domicilio / Despacho parcial"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={() => setSendWhatsAppOnInvoice(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white cursor-pointer"
                >
                  Guardar Factura
                </button>
                <button
                  type="submit"
                  onClick={() => setSendWhatsAppOnInvoice(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Guardar y Enviar por WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GUARDAR / EDITAR CLIENTE EN EL HISTORIAL                */}
      {/* ============================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {editingProfile ? 'Editar Datos del Cliente' : 'Guardar Cliente en Historial'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre o Razón Social del Cliente: *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ej: Inversiones Morales C.A. / Juan Pérez"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Teléfono WhatsApp: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0414-1234567"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    C.I. / RIF:
                  </label>
                  <input
                    type="text"
                    value={profileCustomerId}
                    onChange={(e) => setProfileCustomerId(e.target.value)}
                    placeholder="V-12345678 / J-12345678-9"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dirección Fiscal / Comercial (Opcional):
                </label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="Ej: Av. Principal, Local 4"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notas del Cliente (Opcional):
                </label>
                <input
                  type="text"
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  placeholder="Ej: Cliente frecuente mayorista"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  Guardar en Historial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Automated Notification Queue Runner */}
      {isQueueModalOpen && pendingNotificationDebts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black">
                    Cola de Alertas Automáticas ({currentQueueIndex + 1} de {pendingNotificationDebts.length})
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    MS Morales System Soluciones · Lanzador de Cobranzas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {(() => {
              const currentDebt = pendingNotificationDebts[currentQueueIndex];
              if (!currentDebt) return null;

              const balance = getDebtBalanceInfo(currentDebt, effectiveRate);
              const previewMessage = generateDebtReminderMessage(currentDebt, effectiveRate, store, {
                attemptNumber: currentDebt.eligibility.attemptNumber,
                cadenceDays: currentDebt.followupCadenceDays || globalCadence,
                overrideType:
                  currentDebt.eligibility.alertType === 'due_tomorrow'
                    ? 'due_tomorrow'
                    : currentDebt.eligibility.alertType === 'due_today'
                    ? 'due_today'
                    : 'overdue_followup',
              });

              return (
                <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">
                        {currentDebt.eligibility.reasonLabel}
                      </h4>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {currentDebt.eligibility.alertType === 'due_tomorrow'
                          ? 'Alerta preventiva: vence exactamente mañana. El cliente recibirá el saldo actualizado y los datos de Pago Móvil.'
                          : `Alerta periódica de mora: han pasado ${currentDebt.eligibility.daysSinceLastAlert ?? 'varios'} días desde el último aviso sin registrar abono.`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {currentDebt.customerName}
                      </span>
                      <span className="font-mono text-xs text-neutral-500">
                        {currentDebt.customerPhone}
                      </span>
                    </div>

                    <p className="text-neutral-600 dark:text-neutral-300">
                      {currentDebt.description}
                    </p>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between font-mono">
                      <span className="text-neutral-500">Saldo Pendiente:</span>
                      <div className="text-right">
                        <span className="text-base font-black text-neutral-900 dark:text-white">
                          {formatUsd(balance.remainingUsd)}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {formatVes(balance.remainingVes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1 text-[11px]">
                      Vista previa del mensaje tipo alerta que se abrirá en WhatsApp:
                    </label>
                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 font-mono text-[11px] text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap max-h-44 overflow-y-auto border border-neutral-200 dark:border-neutral-800">
                      {previewMessage}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-400 font-semibold">
                      <span>Progreso de envíos:</span>
                      <span>
                        {currentQueueIndex + 1} de {pendingNotificationDebts.length}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${((currentQueueIndex + 1) / pendingNotificationDebts.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleQueueSkipCurrent}
                      className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      Omitir este cliente
                    </button>
                    <button
                      type="button"
                      onClick={handleQueueSendCurrent}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Abrir WhatsApp & Registrar Alerta</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Cuenta por Cobrar (con Autocompletado del Historial de Clientes) */}
      {isNewDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Registrar Cuenta por Cobrar
                  </h3>
                  <p className="text-[10px] text-neutral-500">
                    Los datos del cliente se guardarán automáticamente en el historial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewDebtOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Selector Rápido desde el Historial de Clientes */}
              {customerProfiles.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                  <label className="block font-bold text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Cargar Cliente Existente del Historial ({customerProfiles.length} guardados):</span>
                  </label>
                  <select
                    value={selectedHistoryProfileId}
                    onChange={(e) => handleSelectProfileInNewDebt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-emerald-500/40 text-neutral-900 dark:text-white font-medium"
                  >
                    <option value="">-- Nuevo cliente (Escribir datos abajo) --</option>
                    {customerProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.customerId ? `(${p.customerId})` : ''} — Tel: {p.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre del Cliente: *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ej: Inversiones Los Teques / Pedro Pérez"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Teléfono WhatsApp: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="0414 1234567"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    C.I. / RIF (Opcional):
                  </label>
                  <input
                    type="text"
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    placeholder="V-12345678 o J-00000000-0"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dirección del Cliente (Se guarda en el historial - Opcional):
                </label>
                <input
                  type="text"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  placeholder="Ej: Zona Industrial / Centro"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-500" />
                    <span>N° Factura: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoiceNumber}
                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                    placeholder="FAC-001"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Concepto de la Factura / Deuda: *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ej: Mantenimiento preventivo y repuestos"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Monto Total de la Factura en USD ($): *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={newAmountUsd}
                    onChange={(e) => setNewAmountUsd(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-lg font-mono font-bold rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
                  <span>Equivalente en Bs. al cambio BCV de hoy:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVes(parseFlexibleNumber(newAmountUsd) * effectiveRate)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Fecha de Vencimiento: *
                  </label>
                  <div className="flex gap-1">
                    {[
                      { label: '+1d (Mañana)', days: 1 },
                      { label: '+7d', days: 7 },
                      { label: '+15d', days: 15 },
                      { label: '+30d', days: 30 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleSetDueDays(btn.days)}
                        className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded font-semibold cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Frecuencia de re-notificación si no cancela a tiempo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCadence(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      newCadence === 2
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Repetir cada 2 días
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCadence(3)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      newCadence === 3
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Repetir cada 3 días
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notas adicionales (Opcional):
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej: Acordó pagar en dos partes"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDebtOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  Registrar Cuenta y Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Abono */}
      {isPaymentModalOpen && selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Registrar Abono / Pago
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {selectedDebtForPayment.customerName}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-500">Saldo pendiente actual:</span>
                <div className="text-right font-mono font-bold">
                  <span className="text-neutral-900 dark:text-white text-sm">
                    {formatUsd(getDebtBalanceInfo(selectedDebtForPayment, effectiveRate).remainingUsd)}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                    {formatVes(getDebtBalanceInfo(selectedDebtForPayment, effectiveRate).remainingVes)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Monto Abonado:
                  </label>
                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPaymentCurrency('USD')}
                      className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        paymentCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentCurrency('VES')}
                      className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        paymentCurrency === 'VES' ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      VES (Bs.)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">
                    {paymentCurrency === 'USD' ? '$' : 'Bs.'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 font-mono font-bold text-lg rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Método de Pago:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as DebtPayment['paymentMethod'])}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="pago_movil">Pago Móvil (Bs.)</option>
                  <option value="efectivo_usd">Efectivo Dólares ($)</option>
                  <option value="efectivo_ves">Efectivo Bolívares (Bs.)</option>
                  <option value="punto_venta">Punto de Venta (Bs.)</option>
                  <option value="zelle">Zelle ($)</option>
                  <option value="transferencia">Transferencia Bancaria (Bs.)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  N° de Referencia / Comprobante (Opcional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Últimos 4 o 6 dígitos de la transferencia"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nota del Abono (Opcional):
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej: Pago parcial recibido por caja"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Abono & Enviar Comprobante</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
