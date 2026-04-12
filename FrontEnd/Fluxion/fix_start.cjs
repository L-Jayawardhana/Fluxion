const fs = require('fs');
let content = fs.readFileSync('move.txt', 'utf8');
content = content.replace(/const FinancialInsights = memo\(function FinancialInsights\({ insights: initialInsights, loading: initialLoading, error: initialError, orgId }\) {/, `export default function FinancialInsightsPage() {
  const { user } = useAuth();
  const orgId = user?.orgId;`);
content = content.replace(/  const \[data, setData\] = useState\(initialInsights\);/, '  const [data, setData] = useState(null);');
content = content.replace(/  const \[loading, setLoading\] = useState\(initialLoading\);/, '  const [loading, setLoading] = useState(false);');
content = content.replace(/  const \[error, setError\] = useState\(initialError\);/, '  const [error, setError] = useState("");');

content = content.replace(/\/\/ Sync initial loading metrics if we haven't filtered[\s\S]*?}, \[initialInsights, initialLoading, initialError, startDate, endDate\]\);/, `  useEffect(() => {
    loadData();
  }, [orgId]);`);

content = content.replace(/}\);$/, '}'); // remove the closing paren from memo

fs.writeFileSync('move_mod3.txt', content);
