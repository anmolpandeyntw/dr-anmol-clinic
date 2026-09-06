import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StatCard } from '../../components/admin/StatCard';
import { Button } from '../../components/common/Button';
import { CreditCard, IndianRupee, CheckCircle2, Search, RefreshCw, XCircle } from 'lucide-react';
import './AdminPaymentsPage.css';

export interface PaymentRow {
  id: string;
  appointment_id: string;
  patient_name?: string;
  patient_mobile?: string;
  clinic_name?: string;
  provider: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  transaction_ref: string | null;
  verified_at: string | null;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [_loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setPayments([
        {
          id: 'pay-001',
          appointment_id: 'apt-001',
          patient_name: 'Anmol Pandey',
          patient_mobile: '7544512222',
          clinic_name: 'Dr. Anmol Pandey Private Clinic',
          provider: 'pay_online',
          amount: 600,
          status: 'PAID',
          transaction_ref: 'UPI-TXN-998271',
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'pay-002',
          appointment_id: 'apt-002',
          patient_name: 'Sanya',
          patient_mobile: '7484615613',
          clinic_name: 'Dr. Anmol Pandey Private Clinic',
          provider: 'pay_at_clinic',
          amount: 600,
          status: 'PENDING',
          transaction_ref: 'REC-PENDING',
          verified_at: null,
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      // Query appointments directly to derive live payment records
      const { data: apts, error: aptsErr } = await supabase
        .from('appointments')
        .select('*, clinics(name)')
        .order('created_at', { ascending: false });

      if (aptsErr || !apts || apts.length === 0) {
        setPayments([]);
      } else {
        const formatted: PaymentRow[] = apts.map((row: any) => {
          const isOnlinePaid = row.payment_method === 'pay_online';
          const hasVisited = row.status === 'checked_in' || row.status === 'in_progress' || row.status === 'completed';
          const isPaid = isOnlinePaid || hasVisited;

          return {
            id: row.id,
            appointment_id: row.id,
            patient_name: row.patient_name,
            patient_mobile: row.patient_mobile,
            clinic_name: row.clinics?.name || 'Dr. Anmol Pandey Private Clinic',
            provider: row.payment_method || 'pay_at_clinic',
            amount: row.fee_amount || 600,
            status: isPaid ? 'PAID' : 'PENDING',
            transaction_ref: isOnlinePaid ? `UPI-${row.id.slice(0, 8).toUpperCase()}` : hasVisited ? `CASH-REC-${row.id.slice(0, 8).toUpperCase()}` : 'PENDING RECEPTION',
            verified_at: isPaid ? row.updated_at || row.created_at : null,
            created_at: row.created_at
          };
        });
        setPayments(formatted);
      }
    } catch (e) {
      console.warn('Payments fetch note:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleMarkAsPaid = async (payment: PaymentRow) => {
    setActionLoading(true);
    setErrorMsg(null);

    setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'PAID', transaction_ref: `CASH-REC-${Date.now()}` } : p));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('appointments')
          .update({ status: 'checked_in', updated_at: new Date().toISOString() })
          .eq('id', payment.appointment_id);
      } catch (e) {
        console.warn('Mark as paid note:', e);
      }
    }
    setActionLoading(false);
    fetchPayments();
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patient_mobile || '').includes(searchTerm) ||
      (p.transaction_ref || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-payments-page">
      <div className="admin-payments-page__header">
        <div>
          <h1>Fees & Payments Directory</h1>
          <p>Verified Revenue counts only Online Paid patients and Patients who ARRIVED at clinic!</p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={fetchPayments}
          icon={<RefreshCw size={16} />}
        >
          Refresh Live
        </Button>
      </div>

      {errorMsg && (
        <div className="admin-payments-page__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Revenue Stats Strip */}
      <div className="admin-payments-metrics">
        <StatCard
          title="Verified Revenue (Arrived & Paid)"
          value={`₹${totalCollected}`}
          icon={<IndianRupee size={20} />}
          variant="success"
        />
        <StatCard
          title="Unverified / Pending Cash"
          value={`₹${totalPending}`}
          icon={<CreditCard size={20} />}
          variant="warning"
        />
        <StatCard
          title="Total Transactions"
          value={payments.length}
          icon={<CheckCircle2 size={20} />}
          variant="primary"
        />
      </div>

      {/* Table Section */}
      <div className="payments-table-container">
        <div className="payments-table__toolbar">
          <div className="payments-table__search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, mobile, or Txn Ref #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="payments-table__filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="PAID">PAID (Online or Arrived)</option>
              <option value="PENDING">PENDING (Not Arrived Yet)</option>
            </select>
          </div>
        </div>

        <div className="payments-table__wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Txn Ref / ID</th>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Clinic</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td className="col-ref">
                    <code>{p.transaction_ref || 'Pending Ref'}</code>
                  </td>
                  <td className="col-patient">{p.patient_name || 'Patient'}</td>
                  <td className="col-mobile">{p.patient_mobile || '--'}</td>
                  <td className="col-clinic">{p.clinic_name || 'Clinic'}</td>
                  <td className="col-amount">₹{p.amount}</td>
                  <td className="col-method">
                    {p.provider === 'pay_at_clinic' ? 'Pay at Clinic' : 'Pay Online (UPI/Card)'}
                  </td>
                  <td className="col-status">
                    <span className={`pay-badge ${p.status === 'PAID' ? 'pay-badge--paid' : 'pay-badge--pending'}`}>
                      {p.status === 'PAID' ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td className="col-action">
                    {p.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionLoading}
                        icon={<CheckCircle2 size={14} />}
                        onClick={() => handleMarkAsPaid(p)}
                        title="Mark Patient as Arrived & Paid"
                      >
                        Mark Arrived & Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    No payment records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
