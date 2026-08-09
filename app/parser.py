import os

import pdfplumber
from docx import Document


def extract_text_from_pdf(file_path: str):
    text = ""

    try:
        with pdfplumber.open(file_path) as pdf:

            for page in pdf.pages:
                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

    except Exception as e:
        raise Exception(
            f"Failed to read PDF: {str(e)}"
        )

    return text


def extract_text_from_docx(file_path: str):
    text = ""

    try:
        document = Document(file_path)

        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                text += paragraph.text + "\n"

    except Exception as e:
        raise Exception(
            f"Failed to read DOCX: {str(e)}"
        )

    return text


def extract_resume_text(file_path: str):

    extension = os.path.splitext(
        file_path
    )[1].lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    elif extension == ".docx":
        return extract_text_from_docx(file_path)

    else:
        raise ValueError(
            "Unsupported file format"
        )