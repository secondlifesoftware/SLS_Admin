from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from datetime import datetime
from io import BytesIO


def generate_invoice_pdf(invoice, client, time_entries, expenses=None):
    """Generate a PDF invoice matching the provided format"""
    if expenses is None:
        expenses = []
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Base style - consistent font throughout
    base_font = 'Helvetica'
    base_font_bold = 'Helvetica-Bold'
    base_font_size = 9  # Standard size for most text
    
    # Custom styles - all using Helvetica with reduced sizes
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Normal'],
        fontSize=11,  # Reduced from 16
        textColor=colors.HexColor('#111827'),
        spaceAfter=2,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=13
    )
    
    compact_header_style = ParagraphStyle(
        'CompactHeader',
        parent=styles['Normal'],
        fontSize=8,  # Reduced from 10
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=1,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=10
    )
    
    invoice_num_style = ParagraphStyle(
        'InvoiceNum',
        parent=styles['Normal'],
        fontSize=20,  # Reduced from 28
        textColor=colors.HexColor('#111827'),
        spaceAfter=4,
        alignment=TA_RIGHT,
        fontName=base_font_bold,
        leading=24
    )
    
    invoice_header_style = ParagraphStyle(
        'InvoiceHeader',
        parent=styles['Normal'],
        fontSize=8,  # Reduced from 10
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=2,
        alignment=TA_RIGHT,
        fontName=base_font,
        leading=10
    )
    
    # Standard text style - used for TO, client info, contract name
    standard_text_style = ParagraphStyle(
        'StandardText',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        spaceAfter=2,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=11
    )
    
    # Label style - for "TO:", "Contract Name:"
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        spaceAfter=2,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=11
    )
    
    # Top Header - Company on left, Invoice on right (properly aligned)
    invoice_date = invoice.issue_date.strftime("%B %d, %Y") if invoice.issue_date else "N/A"
    
    # Create right side header with columns for Invoice # and Date
    invoice_label_style = ParagraphStyle(
        'InvoiceLabel',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=0,
        alignment=TA_RIGHT,
        fontName=base_font,
        leading=10
    )
    
    invoice_value_style = ParagraphStyle(
        'InvoiceValue',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#111827'),
        spaceAfter=0,
        alignment=TA_RIGHT,
        fontName=base_font_bold,
        leading=10
    )
    
    # Right side header with columns: Label | Value - Add colons
    invoice_header_data = [
        [Paragraph("INVOICE", invoice_num_style), ""],  # Large INVOICE spans both columns
        [Paragraph("Invoice #:", invoice_label_style), Paragraph(invoice.invoice_number, invoice_value_style)],
        [Paragraph("Date:", invoice_label_style), Paragraph(invoice_date, invoice_value_style)],
    ]
    
    invoice_header_table = Table(invoice_header_data, colWidths=[1.5*inch, 2.0*inch])
    invoice_header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'RIGHT'),  # INVOICE text
        ('ALIGN', (0, 1), (0, -1), 'RIGHT'),  # Labels right aligned
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Values right aligned
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('SPAN', (0, 0), (1, 0)),  # INVOICE spans both columns
    ]))
    
    # Create main header table with company info on left, invoice info on right
    # Create a nested table for company info to keep it together and properly spaced
    company_info_data = [
        [Paragraph("Second Life Software Consulting", company_style)],
        [Paragraph("1125 Birch Street SW", compact_header_style)],
        [Paragraph("Atlanta, GA 30310", compact_header_style)],
        [Paragraph("Phone: (770) 696-3187", compact_header_style)],
        [Paragraph("Email: info@secondlifesoftware.com", compact_header_style)],
    ]
    
    company_info_table = Table(company_info_data, colWidths=[3.5*inch])
    company_info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    header_data = [
        [
            company_info_table,
            invoice_header_table
        ],
    ]
    
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Client Information - using consistent font and smaller size, left aligned
    # Build TO section as a table with zero padding for absolute left alignment
    to_data = [["TO:"]]
    client_info = [
        f"{client.first_name} {client.last_name}",
    ]
    if client.company:
        client_info.append(client.company)
    if client.address:
        client_info.append(client.address)
    if client.email:
        client_info.append(client.email)
    # Get client contacts if available
    if hasattr(client, 'contacts') and client.contacts and len(client.contacts) > 0:
        contact = client.contacts[0]
        if hasattr(contact, 'phone') and contact.phone:
            client_info.append(contact.phone)
    
    for info in client_info:
        to_data.append([info])
    
    to_table = Table(to_data, colWidths=[7*inch])
    to_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),  # Zero padding for absolute left alignment
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('FONTNAME', (0, 0), (0, 0), base_font_bold),  # TO: label bold
        ('FONTSIZE', (0, 0), (-1, -1), base_font_size),
        ('FONTNAME', (0, 1), (-1, -1), base_font),  # Client info regular
    ]))
    elements.append(to_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Contract Name and Description on same line - using consistent font
    contract_name = invoice.project_name or "N/A"
    # Get description from invoice notes or use default
    description = invoice.notes or "Labor – AI Development & Engineering"
    
    # Create styles for contract section
    contract_label_style = ParagraphStyle(
        'ContractLabel',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        spaceAfter=0,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=11
    )
    
    contract_text_style = ParagraphStyle(
        'ContractText',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        spaceAfter=0,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=11
    )
    
    contract_desc_style = ParagraphStyle(
        'ContractDesc',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        spaceAfter=0,
        alignment=TA_RIGHT,
        fontName=base_font_bold,
        leading=11
    )
    
    # Calculate contract rate (use most common rate from entries, or client hourly_rate)
    contract_rate = None
    if time_entries:
        # Get the most common rate from entries
        rates = [entry.rate for entry in time_entries]
        contract_rate = max(set(rates), key=rates.count) if rates else None
    if not contract_rate and hasattr(client, 'hourly_rate') and client.hourly_rate:
        contract_rate = client.hourly_rate
    
    contract_data = [
        [Paragraph(f"Contract Name: {contract_name}", contract_text_style), 
         Paragraph(description, contract_desc_style)]
    ]
    
    contract_table = Table(contract_data, colWidths=[3.5*inch, 3.5*inch])
    contract_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), base_font),
    ]))
    elements.append(contract_table)
    
    # Add contract rate below description
    if contract_rate:
        contract_rate_style = ParagraphStyle(
            'ContractRate',
            parent=styles['Normal'],
            fontSize=base_font_size,
            textColor=colors.black,
            spaceAfter=0,
            alignment=TA_RIGHT,
            fontName=base_font,
            leading=11
        )
        elements.append(Spacer(1, 0.05*inch))
        elements.append(Paragraph(f"Contract Rate: ${contract_rate:.2f}/hr", contract_rate_style))
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Group entries by person
    entries_by_person = {}
    for entry in time_entries:
        person = entry.person
        if person not in entries_by_person:
            entries_by_person[person] = []
        entries_by_person[person].append(entry)
    
    # Description style for wrapping text - using consistent font
    description_style = ParagraphStyle(
        'Description',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.black,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=11,
        wordWrap='LTR'  # Enable word wrapping for left-to-right text
    )
    
    # Create table for each person
    for person, entries in entries_by_person.items():
        # Table data - Removed RATE column: DATE, PERSON, DESCRIPTION, TIME, HRS, AMOUNT
        table_data = [['DATE', 'PERSON', 'DESCRIPTION', 'TIME', 'HRS', 'AMOUNT']]
        
        for entry in entries:
            date_str = entry.date.strftime("%m/%d/%Y") if entry.date else "N/A"
            time_str = f"{entry.start_time} - {entry.end_time}" if entry.start_time and entry.end_time else "N/A"
            
            # Don't truncate - let it wrap naturally within column width
            # Replace newlines with spaces for proper wrapping
            desc_text = entry.description.replace('\n', ' ').replace('\r', ' ')
            # Use Paragraph for automatic text wrapping - this will wrap within column width
            desc_para = Paragraph(desc_text, description_style)
            
            table_data.append([
                date_str,
                entry.person,
                desc_para,  # Use Paragraph for wrapping
                time_str,
                f"{entry.hours:.2f}",
                f"${entry.amount:.2f}"
            ])
        
        # Create table with proper column widths - removed RATE column
        # Total available width: ~7 inches (8.5" letter - 1.5" margins)
        # Column widths: DATE (larger), PERSON, DESCRIPTION, TIME, HRS, AMOUNT (longer)
        table = Table(table_data, colWidths=[0.85*inch, 0.9*inch, 2.8*inch, 0.85*inch, 0.5*inch, 1.1*inch])
        table.setStyle(TableStyle([
            # Header row - centered
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Center all headers
            ('FONTNAME', (0, 0), (-1, 0), base_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), base_font_size),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (2, -1), 'LEFT'),  # DATE, PERSON, DESCRIPTION left aligned
            ('ALIGN', (3, 1), (3, -1), 'LEFT'),  # TIME left aligned
            ('ALIGN', (4, 1), (4, -1), 'RIGHT'),  # HRS right aligned
            ('ALIGN', (5, 1), (5, -1), 'RIGHT'),  # AMOUNT right aligned
            ('FONTNAME', (0, 1), (-1, -1), base_font),
            ('FONTSIZE', (0, 1), (-1, -1), base_font_size),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top align for wrapping text
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            # Ensure columns don't overflow
            ('WORDWRAP', (2, 1), (2, -1), True),  # Enable word wrap for description column
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Expenses Section (if any)
    if expenses:
        elements.append(Spacer(1, 0.2*inch))
        
        # Section header
        expense_header_style = ParagraphStyle(
            'ExpenseHeader',
            parent=styles['Normal'],
            fontSize=base_font_size + 1,
            textColor=colors.HexColor('#111827'),
            spaceAfter=8,
            alignment=TA_LEFT,
            fontName=base_font_bold,
            leading=12
        )
        elements.append(Paragraph("EXPENSES / REIMBURSEMENTS", expense_header_style))
        
        # Expenses table - same structure as time entries: DATE, PERSON, DESCRIPTION, TIME, HRS, AMOUNT
        expense_table_data = [['DATE', 'PERSON', 'DESCRIPTION', 'TIME', 'HRS', 'AMOUNT']]
        
        for expense in expenses:
            date_str = expense.date.strftime("%m/%d/%Y") if expense.date else "N/A"
            
            # For fixed costs: Person = "System", Time = "0:00 - 0:00", Hours = "0.00"
            person = "System"
            time_str = "0:00 - 0:00"
            hours_str = "0.00"
            
            # If expense has actual time/hours data, use it (for backwards compatibility)
            if expense.start_time and expense.end_time:
                time_str = f"{expense.start_time} - {expense.end_time}"
            if expense.hours and expense.hours > 0:
                hours_str = f"{expense.hours:.2f}"
            
            # Description - just the description, no extra info
            desc_text = expense.description.replace('\n', ' ').replace('\r', ' ')
            desc_para = Paragraph(desc_text, description_style)
            
            expense_table_data.append([
                date_str,
                person,
                desc_para,
                time_str,
                hours_str,
                f"${expense.amount:.2f}"
            ])
        
        expense_table = Table(expense_table_data, colWidths=[0.85*inch, 0.9*inch, 2.8*inch, 0.85*inch, 0.5*inch, 1.1*inch])
        expense_table.setStyle(TableStyle([
            # Header row - centered
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Center all headers
            ('FONTNAME', (0, 0), (-1, 0), base_font_bold),
            ('FONTSIZE', (0, 0), (-1, 0), base_font_size),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (2, -1), 'LEFT'),  # DATE, PERSON, DESCRIPTION left aligned
            ('ALIGN', (3, 1), (3, -1), 'LEFT'),  # TIME left aligned
            ('ALIGN', (4, 1), (4, -1), 'RIGHT'),  # HRS right aligned
            ('ALIGN', (5, 1), (5, -1), 'RIGHT'),  # AMOUNT right aligned
            ('FONTNAME', (0, 1), (-1, -1), base_font),
            ('FONTSIZE', (0, 1), (-1, -1), base_font_size),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top align for wrapping text
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            # Ensure columns don't overflow
            ('WORDWRAP', (2, 1), (2, -1), True),  # Enable word wrap for description column
        ]))
        
        elements.append(expense_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Summary Section
    total_hours = sum(entry.hours for entry in time_entries) if time_entries else 0
    labor_subtotal = sum(entry.amount for entry in time_entries) if time_entries else 0
    expense_subtotal = sum(expense.amount for expense in expenses) if expenses else 0
    subtotal = invoice.amount
    tax = invoice.tax
    total = invoice.total
    
    summary_data = [['', '']]
    
    if time_entries:
        summary_data.append(['Labor hours', f"{total_hours:.2f} hrs"])
        summary_data.append(['Labor subtotal', f"${labor_subtotal:.2f}"])
    
    if expenses:
        summary_data.append(['Expenses subtotal', f"${expense_subtotal:.2f}"])
    
    summary_data.append(['Subtotal', f"${subtotal:.2f}"])
    
    if tax > 0:
        summary_data.append(['Tax', f"${tax:.2f}"])
    
    summary_data.append(['TOTAL DUE', f"${total:.2f}"])
    
    summary_table = Table(summary_data, colWidths=[4*inch, 2.5*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -2), base_font),
        ('FONTNAME', (1, 0), (1, -2), base_font),
        ('FONTSIZE', (0, 0), (-1, -2), base_font_size),
        ('FONTSIZE', (1, 0), (1, -2), base_font_size),
        ('FONTNAME', (0, -1), (-1, -1), base_font_bold),
        ('FONTSIZE', (0, -1), (-1, -1), 10),
        ('TEXTCOLOR', (1, -1), (1, -1), colors.HexColor('#2563eb')),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#d1d5db')),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Footer - using consistent font
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        spaceAfter=3,
        fontName=base_font
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.HexColor('#4b5563'),
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName=base_font
    )
    
    # Payment statement - using consistent font
    payment_style = ParagraphStyle(
        'Payment',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.HexColor('#374151'),
        alignment=TA_CENTER,
        spaceAfter=6,
        fontName=base_font_bold
    )
    
    # Payment Information Section
    payment_info_style = ParagraphStyle(
        'PaymentInfo',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.HexColor('#374151'),
        alignment=TA_LEFT,
        spaceAfter=4,
        fontName=base_font,
        leading=12
    )
    
    payment_info_title_style = ParagraphStyle(
        'PaymentInfoTitle',
        parent=styles['Normal'],
        fontSize=base_font_size + 1,
        textColor=colors.HexColor('#111827'),
        alignment=TA_LEFT,
        spaceAfter=6,
        fontName=base_font_bold,
        leading=14
    )
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("💳 PAYMENT OPTIONS", payment_info_title_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Create 2x2 grid layout for payment options
    # Row 1: Wire Transfer (left) and Zelle (right)
    # Row 2: ACH (left) and PayPal (right)
    
    # Wire Transfer content
    wire_transfer_text = """🔷 <b>Wire Transfer</b><br/>
   Account Number: 620532252<br/>
   Routing Number: 021000021<br/>
   <i>Note: This routing number (021000021) is for wire transfers only.</i>"""
    wire_transfer = Paragraph(wire_transfer_text, payment_info_style)
    
    # Zelle content
    zelle_text = """💸 <b>Zelle</b><br/>
   Email: info@secondlifesoftware.com"""
    zelle = Paragraph(zelle_text, payment_info_style)
    
    # ACH content
    ach_text = """🏦 <b>ACH (Direct Deposit)</b><br/>
   Account Number: 620532252<br/>
   Routing Number: 061092387<br/>
   <i>Note: This routing number (061092387) can only be used for direct deposits and ACH transactions.</i>"""
    ach = Paragraph(ach_text, payment_info_style)
    
    # PayPal content
    paypal_text = """🅿️ <b>PayPal</b><br/>
   Please reach out to info@secondlifesoftware.com for PayPal payment options"""
    paypal = Paragraph(paypal_text, payment_info_style)
    
    # Create a 2x2 table
    payment_table_data = [
        [wire_transfer, zelle],  # Row 1: Wire Transfer and Zelle
        [ach, paypal]            # Row 2: ACH and PayPal
    ]
    
    payment_table = Table(payment_table_data, colWidths=[3.5*inch, 3.5*inch])
    payment_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Align top for both rows
    ]))
    
    elements.append(payment_table)
    elements.append(Spacer(1, 0.15*inch))
    
    elements.append(Paragraph("Make all checks payable to Second Life Software LLC", footer_style))
    elements.append(Spacer(1, 0.08*inch))
    elements.append(Paragraph("THANK YOU FOR YOUR BUSINESS!", footer_style))
    elements.append(Spacer(1, 0.25*inch))
    elements.append(Paragraph("Please remit payment within 14 days of invoice date.", payment_style))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(Paragraph("TERMS AND CONDITIONS: All invoices are due and payable within fourteen (14) days of the invoice date. Late payments may be subject to interest charges at the rate of 1.5% per month (18% per annum) on any outstanding balance. Payment shall be made in United States Dollars by check, wire transfer, or other mutually agreed upon method.", disclaimer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


