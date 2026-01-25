from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from datetime import datetime
from io import BytesIO
import re


def markdown_to_html(text):
    """
    Convert markdown formatting to HTML for ReportLab Paragraph.
    Supports:
    - **bold** → <b>bold</b>
    - *italic* → <i>italic</i>
    """
    if not text:
        return text
    
    # Escape any existing HTML tags first (except we'll add our own)
    # Convert **bold** to <b>bold</b>
    # Handle multiple bold sections in the same text
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    
    # Convert *italic* to <i>italic</i> (but not if it's part of **bold**)
    # Only match single * that aren't part of **
    text = re.sub(r'(?<!\*)\*([^*\n]+?)\*(?!\*)', r'<i>\1</i>', text)
    
    return text


def generate_sow_pdf(scope, client, sections):
    """Generate a PDF for a Scope of Work document"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Base styles
    base_font = 'Helvetica'
    base_font_bold = 'Helvetica-Bold'
    base_font_size = 10
    
    # Title style
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Normal'],
        fontSize=24,
        textColor=colors.HexColor('#111827'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName=base_font_bold,
        leading=28
    )
    
    # Header style
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=14
    )
    
    # Section title style
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#111827'),
        spaceAfter=8,
        spaceBefore=16,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=16
    )
    
    # Body text style  
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.HexColor('#374151'),
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        fontName=base_font,
        leading=15,
        bulletIndent=25,
        leftIndent=0,
        rightIndent=0
    )
    
    # Bullet point style - More pronounced
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontSize=base_font_size,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=14,
        leftIndent=25,
        bulletIndent=5,
        bulletFontName='ZapfDingbats',
        bulletFontSize=8
    )
    
    # Milestone header style
    milestone_style = ParagraphStyle(
        'Milestone',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=8,
        spaceBefore=16,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=16,
        leftIndent=0,
        backColor=colors.HexColor('#EFF6FF'),
        borderPadding=8,
        borderWidth=1,
        borderColor=colors.HexColor('#DBEAFE')
    )
    
    # Milestone detail style
    milestone_detail_style = ParagraphStyle(
        'MilestoneDetail',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=13,
        leftIndent=30,
        bulletIndent=8
    )
    
    # Numbered deliverable style
    numbered_deliverable_style = ParagraphStyle(
        'NumberedDeliverable',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=8,
        spaceBefore=6,
        alignment=TA_LEFT,
        fontName=base_font_bold,
        leading=14,
        leftIndent=15
    )
    
    # Sub-deliverable style (indented under main deliverable)
    sub_deliverable_style = ParagraphStyle(
        'SubDeliverable',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=13,
        leftIndent=45,
        bulletIndent=8
    )
    
    # Company header
    company_header = [
        Paragraph("Second Life Software Consulting", header_style),
        Paragraph("1125 Birch Street SW", header_style),
        Paragraph("Atlanta, GA 30310", header_style),
        Paragraph("Phone: (770) 696-3187", header_style),
        Paragraph("Email: info@secondlifesoftware.com", header_style),
    ]
    
    # Client information
    client_info = [
        Paragraph(f"<b>Client:</b> {client.get('name', 'N/A')}", header_style),
    ]
    if client.get('company'):
        client_info.append(Paragraph(f"<b>Company:</b> {client.get('company')}", header_style))
    if client.get('email'):
        client_info.append(Paragraph(f"<b>Email:</b> {client.get('email')}", header_style))
    if client.get('address'):
        client_info.append(Paragraph(f"<b>Address:</b> {client.get('address')}", header_style))
    
    # Header table - Company left, Client right
    header_data = [
        [company_header, client_info],
    ]
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Align client info to RIGHT
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Document title
    elements.append(Paragraph("STATEMENT OF WORK", title_style))
    elements.append(Paragraph(scope.title, ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=16,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName=base_font,
        leading=18
    )))
    
    # Dates
    if scope.start_date or scope.end_date:
        date_info = []
        if scope.start_date:
            date_info.append(f"<b>Start Date:</b> {scope.start_date.strftime('%B %d, %Y') if hasattr(scope.start_date, 'strftime') else scope.start_date}")
        if scope.end_date:
            date_info.append(f"<b>End Date:</b> {scope.end_date.strftime('%B %d, %Y') if hasattr(scope.end_date, 'strftime') else scope.end_date}")
        elements.append(Paragraph(" | ".join(date_info), header_style))
        elements.append(Spacer(1, 0.2*inch))
    
    # Sections
    for section in sorted(sections, key=lambda s: s.order):
        # Section title - with gray background box
        elements.append(Paragraph(section.title, section_title_style))
        elements.append(Spacer(1, 0.1*inch))
        
        # Section content - convert newlines to paragraphs with better formatting
        if section.content:
            # First convert markdown to HTML (handles **bold** and *italic*)
            content_html = markdown_to_html(section.content)
            
            # Check section type
            is_milestone_section = 'Milestone' in section.title and 'Timeline' in section.title
            is_deliverables_section = 'Deliverable' in section.title
            
            # Split by double newlines for paragraphs
            paragraphs = content_html.split('\n\n')
            
            deliverable_counter = 1
            
            for para in paragraphs:
                if para.strip():
                    # MILESTONES SECTION - Special handling
                    if is_milestone_section:
                        # Check if this is a milestone header
                        if re.match(r'^(Milestone \d+:|Project Timeline|Total Estimated)', para.strip()):
                            elements.append(Paragraph(para.strip(), milestone_style))
                            elements.append(Spacer(1, 0.05*inch))
                            continue
                        
                        # Handle milestone details (lines starting with "- ")
                        lines = para.strip().split('\n')
                        for line in lines:
                            line = line.strip()
                            if not line:
                                continue
                            
                            if line.startswith('- ') or line.startswith('• '):
                                bullet_text = line[2:].strip()
                                # Make the label bold if it has a colon
                                if ':' in bullet_text:
                                    parts = bullet_text.split(':', 1)
                                    formatted_text = f'<b>{parts[0]}:</b>{parts[1]}'
                                    elements.append(Paragraph(f'  • {formatted_text}', milestone_detail_style))
                                else:
                                    elements.append(Paragraph(f'  • {bullet_text}', milestone_detail_style))
                            elif ':' in line:
                                parts = line.split(':', 1)
                                formatted_line = f'<b>{parts[0]}:</b> {parts[1]}'
                                elements.append(Paragraph(formatted_line, milestone_detail_style))
                            else:
                                elements.append(Paragraph(line, body_style))
                    
                    # DELIVERABLES SECTION - Numbered bullets with indented details
                    elif is_deliverables_section:
                        lines = para.strip().split('\n')
                        current_deliverable_has_subitems = False
                        
                        for i, line in enumerate(lines):
                            line = line.strip()
                            if not line:
                                continue
                            
                            # Check if this is a bullet point
                            if line.startswith('- ') or line.startswith('• '):
                                bullet_text = line[2:].strip()
                                
                                # Check next line to see if there are sub-items
                                has_subitems = i + 1 < len(lines) and (lines[i + 1].strip().startswith('  -') or lines[i + 1].strip().startswith('  •'))
                                
                                # Main deliverable - always numbered
                                # Check if it's not indented (main level)
                                if not line.startswith('  '):
                                    if ':' in bullet_text:
                                        parts = bullet_text.split(':', 1)
                                        formatted_text = f'{deliverable_counter}. <b>{parts[0]}:</b>{parts[1]}'
                                    else:
                                        formatted_text = f'{deliverable_counter}. {bullet_text}'
                                    elements.append(Paragraph(formatted_text, numbered_deliverable_style))
                                    deliverable_counter += 1
                                    current_deliverable_has_subitems = has_subitems
                                else:
                                    # Sub-item (indented) - use bullets with extra indent
                                    clean_text = bullet_text
                                    if ':' in clean_text:
                                        parts = clean_text.split(':', 1)
                                        formatted_text = f'<b>{parts[0]}:</b>{parts[1]}'
                                    else:
                                        formatted_text = clean_text
                                    elements.append(Paragraph(f'  • {formatted_text}', sub_deliverable_style))
                            else:
                                # Regular text (intro, summary, etc.)
                                elements.append(Paragraph(line, body_style))
                    
                    # REGULAR SECTIONS - Standard bullet handling
                    else:
                        lines = para.strip().split('\n')
                        for line in lines:
                            line = line.strip()
                            if not line:
                                continue
                            
                            if line.startswith('- ') or line.startswith('• '):
                                bullet_text = line[2:].strip()
                                # Make labels bold if they have colons
                                if ':' in bullet_text:
                                    parts = bullet_text.split(':', 1)
                                    formatted_text = f'<b>{parts[0]}:</b>{parts[1]}'
                                    elements.append(Paragraph(f'• {formatted_text}', bullet_style))
                                else:
                                    elements.append(Paragraph(f'• {bullet_text}', bullet_style))
                            else:
                                elements.append(Paragraph(line, body_style))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # Signature section
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("SIGNATURES", section_title_style))
    
    signature_data = [
        ['', ''],
        ['_________________________', '_________________________'],
        ['Client Signature', 'Vendor Signature'],
        ['', ''],
        ['Date: _______________', 'Date: _______________'],
    ]
    
    signature_table = Table(signature_data, colWidths=[3.5*inch, 3.5*inch])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 1), (-1, 1), base_font),
        ('FONTSIZE', (0, 1), (-1, 1), base_font_size),
        ('TOPPADDING', (0, 1), (-1, 1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
    ]))
    elements.append(signature_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

