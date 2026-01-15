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
        textColor=colors.black,
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName=base_font,
        leading=12,
        wordWrap='LTR',
        bulletIndent=20,  # Indent for bullet points
        leftIndent=0,
        rightIndent=0
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
    
    # Header table
    header_data = [
        [company_header, client_info],
    ]
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
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
        # Section title
        elements.append(Paragraph(section.title, section_title_style))
        
        # Section content - convert newlines to paragraphs
        if section.content:
            # First convert markdown to HTML (handles **bold** and *italic*)
            content_html = markdown_to_html(section.content)
            
            # Split by double newlines for paragraphs
            paragraphs = content_html.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    # Replace single newlines with <br/>
                    para_text = para.strip().replace('\n', '<br/>')
                    elements.append(Paragraph(para_text, body_style))
        
        elements.append(Spacer(1, 0.15*inch))
    
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

