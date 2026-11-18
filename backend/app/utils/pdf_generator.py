import os
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_invoice_pdf(invoice):
    """
    Generates a professional PDF for an invoice.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#006bc9')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    # Header section
    story.append(Paragraph("HOSTEL MANAGEMENT SYSTEM", title_style))
    story.append(Paragraph("Official Fee Invoice & Demand Note", subtitle_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#006bc9'), spaceAfter=15))

    # Meta Table: Student & Invoice details
    student = invoice.student
    meta_data = [
        [
            Paragraph("<b>Billed To:</b>", bold_style),
            Paragraph(f"{student.full_name if student else 'N/A'}<br/>ID: {student.student_id_code if student else 'N/A'}<br/>Course: {student.course or 'N/A'} ({student.department or ''})<br/>Contact: {student.phone or ''}", normal_style),
            Paragraph("<b>Invoice Details:</b>", bold_style),
            Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}<br/><b>Date Issued:</b> {invoice.issued_date}<br/><b>Due Date:</b> {invoice.due_date}<br/><b>Status:</b> {invoice.status.upper()}", normal_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[80, 180, 100, 180])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Line Items Table
    items_data = [
        [
            Paragraph("<b>Description</b>", bold_style),
            Paragraph("<b>Fee Category</b>", bold_style),
            Paragraph("<b>Period</b>", bold_style),
            Paragraph("<b>Amount ($)</b>", bold_style)
        ],
        [
            Paragraph(invoice.title, normal_style),
            Paragraph(invoice.fee_type.capitalize(), normal_style),
            Paragraph(f"{invoice.billing_month or ''} {invoice.billing_year or ''}".strip() or "Standard", normal_style),
            Paragraph(f"${invoice.amount:.2f}", normal_style)
        ]
    ]
    if invoice.late_fee > 0:
        items_data.append([
            Paragraph("Late Fee Penalty", normal_style),
            Paragraph("Penalty", normal_style),
            Paragraph("-", normal_style),
            Paragraph(f"${invoice.late_fee:.2f}", normal_style)
        ])
    if invoice.discount_amount > 0:
        items_data.append([
            Paragraph("Authorized Discount / Concession", normal_style),
            Paragraph("Discount", normal_style),
            Paragraph("-", normal_style),
            Paragraph(f"-${invoice.discount_amount:.2f}", normal_style)
        ])

    items_data.append([
        "", "", Paragraph("<b>Total Billable:</b>", bold_style), Paragraph(f"<b>${invoice.total_amount:.2f}</b>", bold_style)
    ])
    items_data.append([
        "", "", Paragraph("<b>Amount Paid:</b>", bold_style), Paragraph(f"${invoice.paid_amount:.2f}", normal_style)
    ])
    items_data.append([
        "", "", Paragraph("<b>Balance Due:</b>", bold_style), Paragraph(f"<b>${invoice.balance_amount:.2f}</b>", bold_style)
    ])

    items_table = Table(items_data, colWidths=[200, 110, 110, 120])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (3,0), (3,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-4), 0.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (2,-3), (3,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 30))

    # Terms and footer
    story.append(Paragraph("<b>Payment Instructions:</b>", bold_style))
    story.append(Paragraph("Payments can be made securely online via the Student Portal or at the hostel bursar office. Please retain this invoice for your records.", normal_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<i>This is a computer-generated invoice from the Hostel Management Platform. No physical signature is required.</i>", subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_receipt_pdf(payment):
    """
    Generates a professional receipt PDF for a payment.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#059669') # Emerald green for receipt
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    story.append(Paragraph("HOSTEL MANAGEMENT SYSTEM", title_style))
    story.append(Paragraph("Official Hostel Fee Payment Receipt", subtitle_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#059669'), spaceAfter=15))

    student = payment.student
    meta_data = [
        [
            Paragraph("<b>Received From:</b>", bold_style),
            Paragraph(f"{student.full_name if student else 'N/A'}<br/>ID: {student.student_id_code if student else 'N/A'}<br/>Room: {student.get_current_allocation().room.room_number if (student and student.get_current_allocation() and student.get_current_allocation().room) else 'N/A'}", normal_style),
            Paragraph("<b>Receipt Details:</b>", bold_style),
            Paragraph(f"<b>Receipt #:</b> {payment.payment_number}<br/><b>Date & Time:</b> {payment.payment_date.strftime('%Y-%m-%d %H:%M') if payment.payment_date else ''}<br/><b>Status:</b> {payment.status.upper()}<br/><b>Txn Ref:</b> {payment.transaction_reference}", normal_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[90, 170, 90, 190])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    receipt_data = [
        [Paragraph("<b>Particulars</b>", bold_style), Paragraph("<b>Details</b>", bold_style), Paragraph("<b>Amount Received</b>", bold_style)],
        [
            Paragraph("Hostel Fee Payment", normal_style),
            Paragraph(f"Invoice #: {payment.invoice.invoice_number if payment.invoice else 'Direct Payment'}<br/>Method: {payment.payment_method.replace('_', ' ').title()}", normal_style),
            Paragraph(f"<b>${payment.amount:.2f}</b>", bold_style)
        ],
        ["", Paragraph("<b>Total Paid:</b>", bold_style), Paragraph(f"<b>${payment.amount:.2f}</b>", bold_style)]
    ]
    receipt_table = Table(receipt_data, colWidths=[200, 200, 140])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ecfdf5')),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#a7f3d0')),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(receipt_table)
    story.append(Spacer(1, 30))

    story.append(Paragraph("<b>Verification & Security:</b>", bold_style))
    story.append(Paragraph(f"This transaction is permanently logged under audit token <b>{payment.transaction_reference}</b>. Gateway: {payment.payment_gateway}.", normal_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<i>Thank you for your timely payment. Contact hostel office for any payment inquiries.</i>", subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
