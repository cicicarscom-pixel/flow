const fs = require('fs');
let content = fs.readFileSync('IsletmemScreen.tmp.js', 'utf8');

const oldLogicStart = '  useEffect(() => {\\n    const fetchPastDocuments = async () => {';
const oldLogicEnd = '  const tabLabels = {\\n    Gelirler: t(\isletmemScreen.tabs.income\),\\n    Giderler: t(\isletmemScreen.tabs.expense\),\\n    Faturalar: t(\isletmemScreen.tabs.invoices\),\\n  };';

let before = content.substring(0, content.indexOf(oldLogicStart));
let after = content.substring(content.indexOf('  const tabLabels = {'));

const newLogic = \  const getDisplayMonth = (yyyy_mm) => {
    try {
      if (!yyyy_mm) return '';
      const [y, m] = yyyy_mm.split('-');
      const d = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1));
      return d.toLocaleDateString(i18n.language || 'tr-TR', { month: 'long', year: 'numeric' });
    } catch {
      return yyyy_mm;
    }
  };

  useEffect(() => {
    const fetchPastDocuments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let tz = 'Europe/Istanbul';
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).limit(1).maybeSingle();
          if (orgMember?.organization_id) {
            const { data: orgData } = await supabase.from('organizations').select('timezone').eq('id', orgMember.organization_id).single();
            if (orgData?.timezone) tz = orgData.timezone;
          }
        }
        const todayStr = todayInTimezone(tz);
        const { to: p_to } = monthRangeYmd(todayStr);
        const { data: calendarData } = await supabase.rpc('get_payment_calendar', { p_from: '2020-01-01', p_to });
        
        const rawDocs = calendarData || [];

        // Group by Month Year (YYYY-MM)
        const grouped = rawDocs.reduce((acc, doc) => {
          if (!doc.day) return acc;
          const yyyy_mm = doc.day.slice(0, 7);
          if (!acc[yyyy_mm]) {
            acc[yyyy_mm] = [];
          }
          acc[yyyy_mm].push({
             ...doc,
             unifiedDate: doc.day,
             unifiedAmount: doc.amount_minor / 100,
             flow_payment_status: doc.payment_status
          });
          return acc;
        }, {});

        const currentMonthStr = todayStr.slice(0, 7);
        let monthKeys = Object.keys(grouped);
        
        if (!monthKeys.includes(currentMonthStr)) {
          monthKeys.push(currentMonthStr);
          grouped[currentMonthStr] = [];
        }

        // Sort months descending
        monthKeys.sort((a, b) => b.localeCompare(a));

        setMonths(monthKeys);
        if (monthKeys.length > 0 && !selectedMonth) {
          setSelectedMonth(monthKeys[0]);
        }
        
        // Flatten docs
        const allDocs = [];
        monthKeys.forEach(m => {
           if(grouped[m]) allDocs.push(...grouped[m]);
        });
        setDocuments(allDocs);
      } catch (err) {
        console.warn('Error fetching past documents', err);
      }
    };

    fetchPastDocuments();
  }, []);

  const [monthSummaries, setMonthSummaries] = useState({});

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchSummary = async () => {
      try {
        const { from: p_from, to: p_to } = monthRangeYmd(\\-01\);

        const { data: summaryData } = await supabase.rpc('get_finance_summary', { p_from, p_to });
        if (summaryData && summaryData.status === 'SUCCESS') {
          setMonthSummaries(prev => ({
            ...prev,
            [selectedMonth]: {
              income: summaryData.income / 100,
              expense: summaryData.expense / 100,
              balance: (summaryData.income - summaryData.expense) / 100
            }
          }));
        } else {
          setMonthSummaries(prev => ({ ...prev, [selectedMonth]: { income: 0, expense: 0, balance: 0 } }));
        }
      } catch (err) {
        setMonthSummaries(prev => ({ ...prev, [selectedMonth]: { income: 0, expense: 0, balance: 0 } }));
      }
    };

    fetchSummary();
  }, [selectedMonth]);

  const getMonthData = (monthStr) => {
    if (!monthStr) return { income: 0, expense: 0, balance: 0, docs: [] };
    const mDocs = documents.filter(doc => doc.unifiedDate.slice(0, 7) === monthStr);
    const summary = monthSummaries[monthStr] || { income: 0, expense: 0, balance: 0 };
    return { ...summary, docs: mDocs };
  };

  const currentData = getMonthData(selectedMonth);
  const currentMonthIndex = months.indexOf(selectedMonth);
  const prevMonthStr = currentMonthIndex >= 0 && currentMonthIndex + 1 < months.length ? months[currentMonthIndex + 1] : null;
  const prevData = getMonthData(prevMonthStr);

  useEffect(() => {
    if (!selectedMonth) return;
    
    const fetchInsight = async () => {
      setIsInsightLoading(true);
      setInsight('');
      try {
        const { data, error } = await supabase.functions.invoke('generate-insights', {
          body: {
            monthData: { income: currentData.income, expense: currentData.expense },
            previousMonthData: { income: prevData.income, expense: prevData.expense }
          }
        });
        
        if (!error && data?.success) {
          setInsight(data.insight);
        } else {
          setInsight(t('isletmemScreen.insights.unavailable'));
        }
      } catch (e) {
        setInsight(t('isletmemScreen.insights.error'));
      } finally {
        setIsInsightLoading(false);
      }
    };

    fetchInsight();
  }, [selectedMonth]); // Need to fetch when month changes

  const trend = prevData.balance !== 0 
    ? ((currentData.balance - prevData.balance) / Math.abs(prevData.balance)) * 100 
    : 0;

  const displayDocs = currentData.docs.filter(doc => {
    if (activeTab === 'Gelirler') return doc.type === 'income' || doc.type === 'sales';
    if (activeTab === 'Giderler') return doc.type === 'expense';
    return doc.source === 'invoice_scan'; // Faturalar
  });

\

let newContent = before + newLogic + after;
newContent = newContent.replace(\"{m}</Text>\", \"{getDisplayMonth(m)}</Text>\");
fs.writeFileSync('src/modules/muhasebe/presentation/screens/IsletmemScreen.js', newContent, 'utf8');
