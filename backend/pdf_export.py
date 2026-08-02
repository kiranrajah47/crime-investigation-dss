"""
pdf_export.py
-------------
Generates a professional PDF report for a completed case analysis.
Called by the /export/<case_id> route in app.py.

Uses ReportLab to build a structured PDF with:
    - Case header (ID, title, date, investigator)
    - Summary metrics
    - Ranked suspect cards with scores and explanations
    - Disclaimer footer

Usage:
    from pdf_export import generate_case_pdf
    pdf_bytes = generate_case_pdf(case, report)
    # Then send as Flask response
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import io
from datetime import datetime

# ── Color palette ──────────────────────────────────────────────────────────────

NAVY       = colors.HexColor("#0f1f3d")
ACCENT     = colors.HexColor("#3b82f6")
RED        = colors.HexColor("#dc2626")
AMBER      = colors.HexColor("#d97706")
GREEN      = colors.HexColor("#16a34a")
LIGHT_GRAY = colors.HexColor("#f8fafc")
MID_GRAY   = colors.HexColor("#e2e8f0")
TEXT       = colors.HexColor("#1e293b")
MUTED      = colors.HexColor("#64748b")


# ── Styles ─────────────────────────────────────────────────────────────────────

def get_styles():
    base = getSampleStyleSheet()

    styles = {
        "title": ParagraphStyle(
            "title", fontSize=20, fontName="Helvetica-Bold",
            textColor=NAVY, spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontSize=10, fontName="Helvetica",
            textColor=MUTED, spaceAfter=2,
        ),
        "section_head": ParagraphStyle(
            "section_head", fontSize=11, fontName="Helvetica-Bold",
            textColor=NAVY, spaceBefore=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", fontSize=9, fontName="Helvetica",
            textColor=TEXT, leading=14, spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "small", fontSize=8, fontName="Helvetica",
            textColor=MUTED, leading=12,
        ),
        "label": ParagraphStyle(
            "label", fontSize=8, fontName="Helvetica-Bold",
            textColor=MUTED, spaceAfter=2,
        ),
        "suspect_name": ParagraphStyle(
            "suspect_name", fontSize=13, fontName="Helvetica-Bold",
            textColor=NAVY, spaceAfter=2,
        ),
        "disclaimer": ParagraphStyle(
            "disclaimer", fontSize=8, fontName="Helvetica-Oblique",
            textColor=MUTED, leading=12, alignment=TA_CENTER,
        ),
    }
    return styles


# ── Score bar helper ────────────────────────────────────────────────────────────

def score_bar_table(label: str, score: float, color, max_width: float = 10.0):
    """
    Returns a small table row showing a label, a filled bar, and a score value.
    """
    bar_fill = max(0.01, min(score, 1.0)) * max_width
    bar_empty = max_width - bar_fill

    bar_data = [[
        Paragraph(label, ParagraphStyle("bl", fontSize=8, fontName="Helvetica", textColor=MUTED)),
        Table([[""]], colWidths=[bar_fill * cm, bar_empty * cm], rowHeights=[0.25 * cm],
              style=TableStyle([
                  ("BACKGROUND", (0, 0), (0, 0), color),
                  ("BACKGROUND", (1, 0), (1, 0), MID_GRAY),
                  ("LINEABOVE", (0, 0), (-1, -1), 0, colors.white),
              ])),
        Paragraph(f"{score:.4f}", ParagraphStyle("bv", fontSize=8, fontName="Helvetica-Bold",
                                                  textColor=TEXT, alignment=TA_RIGHT)),
    ]]
    return Table(bar_data, colWidths=[3.8 * cm, max_width * cm, 1.5 * cm],
                 style=TableStyle([
                     ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                     ("LEFTPADDING", (0, 0), (-1, -1), 0),
                     ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                     ("TOPPADDING", (0, 0), (-1, -1), 2),
                     ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                 ]))


# ── Main PDF generator ─────────────────────────────────────────────────────────

def generate_case_pdf(case, report: list) -> bytes:
    """
    Generate a complete PDF report for a case analysis.

    Args:
        case   : SQLAlchemy Case object
        report : List of enriched suspect dicts from build_full_report()

    Returns:
        PDF as bytes — ready to send as a Flask file response
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=f"Case Report — {case.case_id}",
        author="Crime Investigation DSS",
    )

    styles = get_styles()
    story  = []
    W      = A4[0] - 4 * cm   # usable width

    # ── Header ──────────────────────────────────────────────────────────────────

    # Top colored bar
    story.append(Table(
        [[""]],
        colWidths=[W], rowHeights=[0.5 * cm],
        style=TableStyle([("BACKGROUND", (0, 0), (0, 0), NAVY)])
    ))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Crime Investigation Decision-Support System", styles["subtitle"]))
    story.append(Paragraph(f"Case Analysis Report — {case.case_id}", styles["title"]))
    story.append(Spacer(1, 0.2 * cm))

    # Case metadata table
    meta_data = [
        ["Case title",    case.title or "Untitled Case",
         "Date analysed", case.formatted_date()],
        ["Investigator",  case.investigator.full_name,
         "Suspects",      str(case.num_suspects)],
        ["Top suspect",   case.top_suspect or "—",
         "Top score",     str(case.top_score)],
    ]

    meta_style = TableStyle([
        ("FONTNAME",    (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",    (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",   (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR",   (2, 0), (2, -1), MUTED),
        ("TEXTCOLOR",   (1, 0), (1, -1), TEXT),
        ("TEXTCOLOR",   (3, 0), (3, -1), TEXT),
        ("BACKGROUND",  (0, 0), (-1, -1), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID",        (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("ROUNDEDCORNERS", [4]),
    ])

    story.append(Table(meta_data,
                       colWidths=[2.5*cm, 5.5*cm, 2.5*cm, 4.5*cm],
                       style=meta_style))
    story.append(Spacer(1, 0.4 * cm))

    # Weights used
    if report and report[0].get("weights_used"):
        w = report[0]["weights_used"]
        weights_text = (
            f"<b>Evidence weights used:</b> "
            f"Physical evidence: <b>{w.get('physical_evidence', '—')}</b> | "
            f"Witness statements: <b>{w.get('witness_statement', '—')}</b> | "
            f"Past history: <b>{w.get('past_history', '—')}</b> | "
            f"Alibi penalty: <b>{w.get('alibi_penalty', '—')}</b>"
        )
        story.append(Paragraph(weights_text, ParagraphStyle(
            "wt", fontSize=8, fontName="Helvetica",
            textColor=colors.HexColor("#0369a1"), leading=12,
            borderColor=colors.HexColor("#bae6fd"), borderWidth=0.5,
            borderPadding=6, backColor=colors.HexColor("#f0f9ff"),
        )))
        story.append(Spacer(1, 0.4 * cm))

    story.append(HRFlowable(width="100%", thickness=1, color=MID_GRAY))
    story.append(Spacer(1, 0.3 * cm))

    # ── Suspect cards ────────────────────────────────────────────────────────────

    story.append(Paragraph("Suspect Ranking", styles["section_head"]))

    for suspect in report:
        score = suspect["final_score"]

        prio = suspect.get("priority", "Low concern")
        if prio == "Primary suspect":
            priority_color = RED
            priority_label = "PRIMARY SUSPECT"
            bar_color      = RED
        elif prio == "Secondary suspect":
            priority_color = AMBER
            priority_label = "SECONDARY SUSPECT"
            bar_color      = AMBER
        else:
            priority_color = GREEN
            priority_label = "LOW CONCERN"
            bar_color      = GREEN

        card_elements = []

        # Suspect header row
        header_data = [[
            Paragraph(f"#{suspect['rank']}", ParagraphStyle(
                "rk", fontSize=14, fontName="Helvetica-Bold", textColor=colors.white
            )),
            Paragraph(suspect["name"], ParagraphStyle(
                "sn", fontSize=12, fontName="Helvetica-Bold", textColor=NAVY
            )),
            Paragraph(
                f"Score: <b>{score}</b>",
                ParagraphStyle("sc", fontSize=9, fontName="Helvetica", textColor=MUTED)
            ),
            Paragraph(priority_label, ParagraphStyle(
                "pr", fontSize=8, fontName="Helvetica-Bold",
                textColor=colors.white, alignment=TA_CENTER
            )),
        ]]

        header_table = Table(
            header_data,
            colWidths=[1.0*cm, 7.0*cm, 3.5*cm, 3.5*cm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), priority_color),
                ("BACKGROUND", (3, 0), (3, 0), priority_color),
                ("BACKGROUND", (1, 0), (2, 0), LIGHT_GRAY),
                ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN",      (0, 0), (0, 0), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("ROUNDEDCORNERS", [4]),
            ])
        )
        card_elements.append(header_table)
        card_elements.append(Spacer(1, 0.15 * cm))

        # Score breakdown bars
        card_elements.append(Paragraph("EVIDENCE SCORE BREAKDOWN", styles["label"]))
        card_elements.append(score_bar_table("Physical evidence", suspect["evidence_sim"], bar_color))
        card_elements.append(score_bar_table("Witness / victim link", suspect["victim_sim"], bar_color))
        card_elements.append(score_bar_table("Past history", suspect["past_history_score"], bar_color))
        card_elements.append(score_bar_table("Alibi strength", suspect["alibi_score"], GREEN))
        card_elements.append(Spacer(1, 0.15 * cm))

        # Evidence signal tags
        if suspect.get("signals"):
            card_elements.append(Paragraph("KEY EVIDENCE SIGNALS", styles["label"]))
            tag_text = "  ".join([
                f'<font color="{"#b91c1c" if s["type"]=="against" else "#15803d" if s["type"]=="for" else "#475569"}">'
                f'[{s["label"]}]</font>'
                for s in suspect["signals"]
            ])
            card_elements.append(Paragraph(tag_text, ParagraphStyle(
                "tags", fontSize=8, fontName="Helvetica", leading=14
            )))
            card_elements.append(Spacer(1, 0.1 * cm))

        # System reasoning
        card_elements.append(Paragraph("SYSTEM REASONING", styles["label"]))
        card_elements.append(Paragraph(suspect.get("explanation", ""), ParagraphStyle(
            "reason", fontSize=8, fontName="Helvetica",
            textColor=TEXT, leading=13,
            borderColor=MID_GRAY, borderWidth=0.5, borderPadding=6,
            backColor=LIGHT_GRAY,
        )))
        card_elements.append(Spacer(1, 0.3 * cm))
        card_elements.append(HRFlowable(width="100%", thickness=0.5, color=MID_GRAY))
        card_elements.append(Spacer(1, 0.2 * cm))

        story.append(KeepTogether(card_elements))

    # ── Disclaimer ───────────────────────────────────────────────────────────────

    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        "This report was generated by an AI-based decision-support system. "
        "It is intended to assist — not replace — qualified investigator judgment. "
        "All findings must be independently verified before any investigative action is taken. "
        f"Generated: {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')} | "
        "Crime Investigation DSS | VTU Project 2026–27",
        styles["disclaimer"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
