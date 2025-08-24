// src/components/Payslip.jsx

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../supabaseClient'; // PAYROLL MIGRATION: Import Supabase
import { useAppContext } from '../contexts/AppContext';


function Payslip({ payrollRun, employeeData, employeeProfile }) {
  const { companyId } = useAppContext();
  const [companyInfo, setCompanyInfo] = useState(null);

  // PAYROLL MIGRATION: Fetch settings from the 'payroll_settings' table
  useEffect(() => {
    if (!companyId) return;
    const fetchCompanyInfo = async () => {
        const { data, error } = await supabase
            .from('payroll_settings')
            .select('*')
            .eq('company_id', companyId)
            .single();
        
        if (error) console.error("Error fetching payroll settings for payslip:", error);
        else setCompanyInfo(data);
    };
    fetchCompanyInfo();
  }, [companyId]);

  if (!payrollRun || !employeeData || !employeeProfile) return null;

  const grossPay = (employeeData.baseSalary || 0) + (employeeData.overtime || 0) + (employeeData.bonuses || 0) + (employeeData.benefits || 0);
  const totalDeductions = (employeeData.cnss || 0) + (employeeData.amo || 0) + (employeeData.ir || 0) + (employeeData.otherDeductions || 0);
  const netPay = grossPay - totalDeductions;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    // PAYROLL MIGRATION: Use new field names from payroll_settings table
    doc.text(companyInfo?.company_name || 'Cohesio Inc.', 15, 20);
    doc.setFontSize(10);
    doc.text(companyInfo?.company_address || '123 Main Street', 15, 26);
    doc.text(`RC: ${companyInfo?.rc_number || 'N/A'} | CNSS: ${companyInfo?.cnss_number || 'N/A'}`, 15, 32);

    doc.setFontSize(18);
    doc.text('BULLETIN DE PAIE', 200, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`Période: ${payrollRun.period_label}`, 200, 28, { align: 'right' });

    // Employee Info
    doc.autoTable({
        startY: 40,
        body: [
            ['Matricule', employeeProfile.id.substring(0, 8), 'Nom & Prénom', employeeProfile.name],
            ['N° CNSS', employeeProfile.cnss_number || 'N/A', 'Poste', employeeProfile.position],
            ['Date d\'embauche', employeeProfile.hire_date, 'Salaire Net à Payer', `${netPay.toFixed(2)} MAD`],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            2: { fontStyle: 'bold' }
        }
    });

    // Earnings and Deductions
    const earnings = [
        ['Salaire de Base', (employeeData.baseSalary || 0).toFixed(2)],
        ['Primes et Indemnités', (employeeData.bonuses || 0).toFixed(2)],
    ];
    const deductions = [
        ['CNSS & AMO', (employeeData.cnss || 0).toFixed(2)],
        ['Impôt sur le Revenu (IR)', (employeeData.ir || 0).toFixed(2)],
        ['Autres Retenues', (employeeData.otherDeductions || 0).toFixed(2)],
    ];

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Gains', 'Montant (MAD)']],
        body: earnings,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] }
    });

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 2,
        head: [['Retenues', 'Montant (MAD)']],
        body: deductions,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] }
    });

    // Totals
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 5,
        body: [
            ['Salaire Brut', `${grossPay.toFixed(2)} MAD`],
            ['Total des Retenues', `${totalDeductions.toFixed(2)} MAD`],
            [{ content: 'Salaire Net à Payer', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: `${netPay.toFixed(2)} MAD`, styles: { fontStyle: 'bold', fontSize: 12 } }],
        ],
        theme: 'grid',
        columnStyles: { 0: { fontStyle: 'bold' } }
    });


    doc.save(`Payslip-${payrollRun.period_label}-${employeeProfile.name}.pdf`);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border max-w-4xl mx-auto font-sans">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-2xl font-bold text-gray-800">{companyInfo?.company_name || 'Cohesio Inc.'}</h3>
                <p className="text-sm text-gray-500">{companyInfo?.company_address || '123 Main Street'}</p>
            </div>
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                <Download size={16}/> Download PDF
            </button>
        </div>
        <hr className="my-4"/>
        <h2 className="text-center font-bold text-xl my-4">BULLETIN DE PAIE - {payrollRun.period_label}</h2>

        <div className="text-right mt-8">
            <p className="font-bold text-lg">Net à Payer: {netPay.toFixed(2)} MAD</p>
        </div>
    </div>
  );
}

export default Payslip;