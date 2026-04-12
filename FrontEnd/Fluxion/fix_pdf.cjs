const fs = require('fs');

let page = fs.readFileSync('src/pages/Reports/FinancialInsightsPage.jsx', 'utf8');

// Insert JS PDF imports
page = page.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx';\nimport jsPDF from 'jspdf';\nimport 'jspdf-autotable';");

// Replace handleExportPDF
const newPdf = `const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    let currentY = 14;

    doc.setFontSize(16);
    doc.text('Financial Insights Report', 14, currentY);
    currentY += 10;

    const formatCurrency = (v) => \`\$\${(v || 0).toFixed(2)}\`;

    // Budget vs Actual
    doc.setFontSize(12);
    doc.text('Budget vs Actual', 14, currentY);
    currentY += 5;
    doc.autoTable({
      startY: currentY,
      head: [['Metric', 'Value']],
      body: [
        ['Total Budget', formatCurrency(data.budgetComparison?.totalBudget)],
        ['Actual Spend', formatCurrency(data.budgetComparison?.actualSpend)],
        ['Variance', formatCurrency(data.budgetComparison?.variance)]
      ],
      margin: { left: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // Spend By Department
    if (spendByDepartment && spendByDepartment.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 14; }
      doc.text('Spend by Department', 14, currentY);
      doc.autoTable({
        startY: currentY + 5,
        head: [['Department', 'Labour', 'Parts', 'Total Maintenance', 'Total Spend']],
        body: spendByDepartment.map(d => [
          d.departmentName,
          formatCurrency(d.laborSpend),
          formatCurrency(d.partsSpend),
          formatCurrency(d.maintenanceSpend),
          formatCurrency(d.totalSpend)
        ]),
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Cost Per Technician
    if (costPerTechnician && costPerTechnician.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 14; }
      doc.text('Cost per Technician', 14, currentY);
      doc.autoTable({
        startY: currentY + 5,
        head: [['Technician', 'Labour', 'Parts', 'Total']],
        body: costPerTechnician.map(t => [
          t.technicianName,
          formatCurrency(t.laborCost),
          formatCurrency(t.partsCost),
          formatCurrency(t.totalCost)
        ]),
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Cost Per Asset
    if (costPerAsset && costPerAsset.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 14; }
      doc.text('Cost per Asset (Top 10)', 14, currentY);
      doc.autoTable({
        startY: currentY + 5,
        head: [['Asset', 'Initial Cost', 'Labour', 'Parts', 'Total Maint.', 'Total Cost']],
        body: costPerAsset.map(a => [
          a.assetName,
          formatCurrency(a.purchaseCost),
          formatCurrency(a.laborCost),
          formatCurrency(a.partsCost),
          formatCurrency(a.maintenanceCost),
          formatCurrency(a.totalCost)
        ]),
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Monthly Trends
    if (monthlyTrends && monthlyTrends.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 14; }
      doc.text('Monthly Spend Trends', 14, currentY);
      doc.autoTable({
        startY: currentY + 5,
        head: [['Month', 'Labour', 'Parts', 'Total']],
        body: monthlyTrends.map(m => [
          m.month,
          formatCurrency(m.laborSpend),
          formatCurrency(m.partsSpend),
          formatCurrency(m.spend)
        ]),
        margin: { left: 14 }
      });
    }

    doc.save(\`Financial_Insights_\${startDate || 'All'}_to_\${endDate || 'All'}.pdf\`);
  };`;

page = page.replace("const handleExportPDF = () => {\n    window.print();\n  };", newPdf);
fs.writeFileSync('src/pages/Reports/FinancialInsightsPage.jsx', page);
