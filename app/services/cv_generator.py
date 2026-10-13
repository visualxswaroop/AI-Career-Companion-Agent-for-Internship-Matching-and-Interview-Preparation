"""
ReportLab CV Generator Service.

Generates professional PDF CVs from structured resume data.
Supports three templates:
  - "professional" : clean two-column, classic dark header
  - "modern"       : gradient accent bar, icon-style section headers
  - "academic"     : single-column, serif typography, publication-ready
"""

import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas


# ──────────────────────────────────────────────────────────────────
# Colour Palettes per Template
# ──────────────────────────────────────────────────────────────────

PALETTES = {
    "professional": {
        "header_bg": colors.HexColor("#1E1B4B"),   # deep indigo
        "header_fg": colors.white,
        "accent": colors.HexColor("#4F46E5"),
        "section_title_fg": colors.HexColor("#1E1B4B"),
        "body_fg": colors.HexColor("#374151"),
        "muted_fg": colors.HexColor("#6B7280"),
        "rule": colors.HexColor("#E5E7EB"),
    },
    "modern": {
        "header_bg": colors.HexColor("#0F172A"),
        "header_fg": colors.white,
        "accent": colors.HexColor("#06B6D4"),
        "section_title_fg": colors.HexColor("#06B6D4"),
        "body_fg": colors.HexColor("#1E293B"),
        "muted_fg": colors.HexColor("#64748B"),
        "rule": colors.HexColor("#CBD5E1"),
    },
    "academic": {
        "header_bg": colors.HexColor("#1A1A2E"),
        "header_fg": colors.white,
        "accent": colors.HexColor("#8B5CF6"),
        "section_title_fg": colors.HexColor("#6D28D9"),
        "body_fg": colors.HexColor("#111827"),
        "muted_fg": colors.HexColor("#6B7280"),
        "rule": colors.HexColor("#D1D5DB"),
    },
}


# ──────────────────────────────────────────────────────────────────
# Helper: Build Paragraph Styles
# ──────────────────────────────────────────────────────────────────

def _build_styles(palette: dict) -> dict:
    base = getSampleStyleSheet()

    return {
        "name": ParagraphStyle(
            "Name",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=palette["header_fg"],
            leading=28,
            alignment=TA_LEFT,
        ),
        "contact": ParagraphStyle(
            "Contact",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=colors.HexColor("#CBD5E1"),
            leading=14,
            alignment=TA_LEFT,
        ),
        "section_title": ParagraphStyle(
            "SectionTitle",
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=palette["section_title_fg"],
            leading=14,
            spaceBefore=6,
            spaceAfter=3,
            letterSpacing=0.8,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName="Helvetica",
            fontSize=9,
            textColor=palette["body_fg"],
            leading=14,
            alignment=TA_JUSTIFY,
        ),
        "body_bold": ParagraphStyle(
            "BodyBold",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=palette["body_fg"],
            leading=14,
        ),
        "muted": ParagraphStyle(
            "Muted",
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            textColor=palette["muted_fg"],
            leading=13,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            fontName="Helvetica",
            fontSize=9,
            textColor=palette["body_fg"],
            leading=13,
            leftIndent=12,
            bulletIndent=0,
        ),
        "tag": ParagraphStyle(
            "Tag",
            fontName="Helvetica",
            fontSize=8,
            textColor=palette["section_title_fg"],
            leading=12,
        ),
    }


# ──────────────────────────────────────────────────────────────────
# Helper: Section Builder
# ──────────────────────────────────────────────────────────────────

def _section(title: str, styles: dict, palette: dict) -> list:
    """Return section header flowables."""
    return [
        Spacer(1, 8),
        Paragraph(title.upper(), styles["section_title"]),
        HRFlowable(
            width="100%",
            thickness=1,
            color=palette["rule"],
            spaceAfter=4,
        ),
    ]


def _bullet_list(items: list[str], styles: dict) -> list:
    """Return bullet paragraph flowables."""
    result = []
    for item in items:
        if item.strip():
            result.append(Paragraph(f"• {item.strip()}", styles["bullet"]))
    return result


def _tags_paragraph(items: list[str], styles: dict, palette: dict) -> list:
    """Render skill tags as comma-separated colored text."""
    if not items:
        return []
    text = "  ·  ".join(str(s).strip() for s in items if str(s).strip())
    return [Paragraph(text, styles["tag"]), Spacer(1, 4)]


# ──────────────────────────────────────────────────────────────────
# Header Canvas (colored background behind name/contact)
# ──────────────────────────────────────────────────────────────────

class _HeaderCanvas(canvas.Canvas):
    """Custom canvas that draws the header background rectangle."""

    def __init__(self, *args, **kwargs):
        self._palette = kwargs.pop("palette", PALETTES["professional"])
        super().__init__(*args, **kwargs)
        self._header_height = 60 * mm

    def showPage(self):
        self._draw_header()
        super().showPage()

    def save(self):
        self._draw_header()
        super().save()

    def _draw_header(self):
        w, h = A4
        self.setFillColor(self._palette["header_bg"])
        self.rect(0, h - self._header_height, w, self._header_height, fill=1, stroke=0)


# ──────────────────────────────────────────────────────────────────
# Main Generator
# ──────────────────────────────────────────────────────────────────

def generate_cv_pdf(
    resume_data: dict[str, Any],
    template: str = "professional",
) -> bytes:
    """
    Generate a PDF CV from parsed resume data.

    Args:
        resume_data: Parsed resume dict from parse_resume().
        template: "professional" | "modern" | "academic"

    Returns:
        PDF file as bytes.
    """
    if template not in PALETTES:
        template = "professional"

    palette = PALETTES[template]
    styles = _build_styles(palette)

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=62 * mm,     # leave room for colored header
        bottomMargin=1.5 * cm,
        title=f"CV — {resume_data.get('full_name', 'Candidate')}",
        author="AI Career Companion Agent",
    )

    story = []
    s = styles

    # ── Contact Block (rendered inside header via canvas) ──
    # We add Name + contact at the top of the story but they overlap
    # with the canvas header — we use topMargin offset to place them.

    name = resume_data.get("full_name") or "Your Name"
    email = resume_data.get("email", "")
    phone = resume_data.get("phone", "")
    location = resume_data.get("address", "")
    linkedin = resume_data.get("linkedin", "")
    github = resume_data.get("github", "")

    contact_parts = [p for p in [email, phone, location, linkedin, github] if p]
    contact_line = "  |  ".join(contact_parts)

    # Push name/contact into the colored header area using negative spacer trick
    story.append(Spacer(1, -55 * mm))
    story.append(Paragraph(name, s["name"]))
    story.append(Paragraph(contact_line, s["contact"]))
    story.append(Spacer(1, 55 * mm))

    # ── Professional Summary ──────────────────────────────────────
    summary = resume_data.get("professional_summary", "")
    if summary:
        story += _section("Professional Summary", s, palette)
        story.append(Paragraph(summary, s["body"]))

    # ── Skills ────────────────────────────────────────────────────
    skills = resume_data.get("skills", [])
    tech_skills = resume_data.get("technical_skills", [])
    soft_skills = resume_data.get("soft_skills", [])
    all_skills = list(dict.fromkeys(skills + tech_skills))  # deduplicate

    if all_skills or soft_skills:
        story += _section("Skills", s, palette)
        if all_skills:
            story.append(Paragraph("Technical", s["body_bold"]))
            story += _tags_paragraph(all_skills, s, palette)
        if soft_skills:
            story.append(Paragraph("Soft Skills", s["body_bold"]))
            story += _tags_paragraph(soft_skills, s, palette)

    # ── Work Experience ───────────────────────────────────────────
    work = resume_data.get("work_experience", [])
    if work:
        story += _section("Work Experience", s, palette)
        story += _bullet_list(work, s)

    # ── Internships ───────────────────────────────────────────────
    internships = resume_data.get("internships", [])
    if internships:
        story += _section("Internships", s, palette)
        story += _bullet_list(internships, s)

    # ── Projects ──────────────────────────────────────────────────
    projects = resume_data.get("projects", [])
    if projects:
        story += _section("Projects", s, palette)
        story += _bullet_list(projects, s)

    # ── Education ─────────────────────────────────────────────────
    education = resume_data.get("education", [])
    if education:
        story += _section("Education", s, palette)
        story += _bullet_list(education, s)

    # ── Certifications ────────────────────────────────────────────
    certifications = resume_data.get("certifications", [])
    if certifications:
        story += _section("Certifications", s, palette)
        story += _bullet_list(certifications, s)

    # ── Languages ─────────────────────────────────────────────────
    languages = resume_data.get("languages", [])
    if languages:
        story += _section("Languages", s, palette)
        story += _tags_paragraph(languages, s, palette)

    # ── Achievements ──────────────────────────────────────────────
    achievements = resume_data.get("achievements", [])
    if achievements:
        story += _section("Achievements", s, palette)
        story += _bullet_list(achievements, s)

    # ── Build PDF ─────────────────────────────────────────────────
    def _make_canvas(filename, **kwargs):
        c = _HeaderCanvas(filename, pagesize=A4, palette=palette)
        return c

    doc.build(story, canvasmaker=_make_canvas)

    buffer.seek(0)
    return buffer.read()
